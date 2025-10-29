package AI

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

// Command represents a single AI command to execute
type Command struct {
	Action string `json:"action"` // "createFolder" or "createFile"
	Path   string `json:"path"`   // Directory path where to create
	Name   string `json:"name"`   // Name of folder/file to create
}

// AIResponse represents the structured response from AI
type AIResponse struct {
	Commands []Command `json:"commands"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents the request to Cerebras API
type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

// ChatChoice represents a choice in the response
type ChatChoice struct {
	Message      Message `json:"message"`
	Index        int     `json:"index"`
	FinishReason string  `json:"finish_reason"`
}

// ChatResponse represents the response from Cerebras API
type ChatResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Created int64        `json:"created"`
	Model   string       `json:"model"`
	Choices []ChatChoice `json:"choices"`
}

// init loads environment variables
func init() {
	godotenv.Load()
}

// GetAICommands takes a user prompt and current path, returns commands to execute
func GetAICommands(userPrompt string, currentPath string) ([]Command, error) {
	apiKey := os.Getenv("CEREBRAS_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("CEREBRAS_API_KEY not found in environment variables")
	}

	// Create system prompt to guide AI
	systemPrompt := fmt.Sprintf(`You are a file manager assistant. The user is currently in: %s

You can only perform TWO actions:
1. createFolder - creates a new folder
2. createFile - creates a new file

Respond ONLY with valid JSON in this exact format:
{
  "commands": [
    {"action": "createFolder", "path": "%s", "name": "folder_name"},
    {"action": "createFile", "path": "%s", "name": "file.txt"}
  ]
}

Rules:
- Use the current path provided
- action must be exactly "createFolder" or "createFile"
- path is where to create (use current path)
- name is the folder/file name
- Return empty commands array if request is not about creating files/folders
- NO explanations, ONLY JSON`, currentPath, currentPath, currentPath)

	requestBody := ChatRequest{
		Model: "qwen-3-235b-a22b-instruct-2507",
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Stream: false,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.cerebras.ai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var chatResponse ChatResponse
	err = json.Unmarshal(body, &chatResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResponse.Choices) == 0 {
		return nil, fmt.Errorf("no response from API")
	}

	// Parse the AI's JSON response
	aiContent := chatResponse.Choices[0].Message.Content
	var aiResponse AIResponse
	err = json.Unmarshal([]byte(aiContent), &aiResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to parse AI commands: %w. Response: %s", err, aiContent)
	}

	return aiResponse.Commands, nil
}

// ExecuteCommands executes the approved commands
func ExecuteCommands(commands []Command) []error {
	var errors []error

	for _, cmd := range commands {
		var err error
		switch cmd.Action {
		case "createFolder":
			err = CreateFolder(cmd.Path, cmd.Name)
		case "createFile":
			err = CreateFile(cmd.Path, cmd.Name)
		default:
			err = fmt.Errorf("unknown action: %s", cmd.Action)
		}

		if err != nil {
			errors = append(errors, fmt.Errorf("failed to execute %s '%s': %w", cmd.Action, cmd.Name, err))
		}
	}

	return errors
}
