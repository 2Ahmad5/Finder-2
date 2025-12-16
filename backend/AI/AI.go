package AI

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"Finder-2/backend/entity"

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

// ItemSummary represents a summary for a single file or folder
type ItemSummary struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// SummarizeResponse represents the AI response for directory summarization
type SummarizeResponse struct {
	Items   []ItemSummary `json:"items"`
	Summary string        `json:"summary"`
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

// SummarizeDirectory analyzes a directory and returns descriptions for each item
func SummarizeDirectory(directoryPath string) (*SummarizeResponse, error) {
	apiKey := os.Getenv("CEREBRAS_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("CEREBRAS_API_KEY not found in environment variables")
	}

	// Read directory contents
	entries, err := os.ReadDir(directoryPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	// Build a list of items with their type and basic info
	var itemsList string
	for _, entry := range entries {
		itemType := "file"
		if entry.IsDir() {
			subPath := directoryPath + "/" + entry.Name()
			subEntries, err := os.ReadDir(subPath)
			depth := "shallow"
			if err == nil {
				for _, subEntry := range subEntries {
					if subEntry.IsDir() {
						depth = "deep"
						break
					}
				}
			}
			itemType = fmt.Sprintf("folder (%s)", depth)
		}
		itemsList += fmt.Sprintf("- %s [%s]\n", entry.Name(), itemType)
	}

	if itemsList == "" {
		itemsList = "(empty directory)"
	}

	// Create system prompt for summarization
	systemPrompt := fmt.Sprintf(`You are a file system analyzer. You will be given a list of files and folders in a directory.

For each item, provide a brief description of what it likely is or does based on its name.

For folders marked as "deep", do NOT include them in your response - they need separate analysis.
For folders marked as "shallow", include a description of what the folder likely contains.

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {"name": "filename.txt", "description": "Brief description of what this file is for"},
    {"name": "folder_name", "description": "Brief description of what this folder contains"}
  ],
  "summary": "A 2-4 sentence summary of what this directory contains overall and its purpose."
}

Rules:
- Only include items that you can describe (skip deep folders)
- Keep descriptions concise (1 sentence max)
- The summary should give an overview of the directory's purpose
- NO explanations outside the JSON, ONLY valid JSON`)

	userPrompt := fmt.Sprintf("Directory: %s\n\nContents:\n%s", directoryPath, itemsList)

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
	var summarizeResponse SummarizeResponse
	err = json.Unmarshal([]byte(aiContent), &summarizeResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to parse AI summary: %w. Response: %s", err, aiContent)
	}

	// Write the summary to a file in the directory
	err = writeSummaryFile(directoryPath, &summarizeResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to write summary file: %w", err)
	}

	return &summarizeResponse, nil
}

// writeSummaryFile creates a summary text file in the directory
func writeSummaryFile(directoryPath string, summary *SummarizeResponse) error {
	var content string
	content += "=== Directory Summary ===\n\n"
	content += summary.Summary + "\n\n"
	content += "=== Contents ===\n\n"

	for _, item := range summary.Items {
		content += fmt.Sprintf("• %s\n  %s\n\n", item.Name, item.Description)
	}

	content += "---\nGenerated by Finder AI\n"

	return CreateFileWithContent(directoryPath, ".directory_summary.txt", content)
}

// RecommendMoveResponse represents the AI response for move recommendations
type RecommendMoveResponse struct {
	Paths []string `json:"paths"`
}

// RecommendMove analyzes a file and recommends top 3 folders to move it to
func RecommendMove(fileName string, fileData string) (*RecommendMoveResponse, error) {
	fmt.Println("[RecommendMove] Starting for file:", fileName)

	apiKey := os.Getenv("CEREBRAS_API_KEY")
	if apiKey == "" {
		fmt.Println("[RecommendMove] ERROR: CEREBRAS_API_KEY not found")
		return nil, fmt.Errorf("CEREBRAS_API_KEY not found in environment variables")
	}
	fmt.Println("[RecommendMove] API key found")

	// Get the Documents directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Println("[RecommendMove] ERROR: failed to get home directory:", err)
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	documentsPath := filepath.Join(homeDir, "Documents")
	fmt.Println("[RecommendMove] Documents path:", documentsPath)

	// Collect all folder names (stopping at project boundaries)
	folders := collectFolders(documentsPath, 10)
	fmt.Println("[RecommendMove] Found", len(folders), "folders")

	if len(folders) == 0 {
		fmt.Println("[RecommendMove] ERROR: no folders found")
		return nil, fmt.Errorf("no folders found in Documents directory")
	}

	// Build folder list for prompt
	folderList := strings.Join(folders, "\n")

	// Create system prompt
	systemPrompt := `You are a file organization assistant. Given a file name, its contents/data, and a list of available folders, recommend the top 3 best folders to move this file to.

Respond ONLY with valid JSON in this exact format:
{
  "paths": [
    "/full/path/to/folder1",
    "/full/path/to/folder2",
    "/full/path/to/folder3"
  ]
}

Rules:
- Return exactly 3 folder paths, ordered from best to least preferred
- Only recommend folders from the provided list
- Use the exact folder paths provided
- Consider file type, name, and content when making recommendations
- NO explanations, ONLY the JSON with paths`

	// Truncate fileData if too long
	truncatedData := fileData
	if len(fileData) > 2000 {
		truncatedData = fileData[:2000] + "... (truncated)"
	}

	userPrompt := fmt.Sprintf("File name: %s\n\nFile data/content:\n%s\n\nAvailable folders:\n%s", fileName, truncatedData, folderList)

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
		fmt.Println("[RecommendMove] ERROR: API request failed with status", resp.StatusCode)
		fmt.Println("[RecommendMove] Response body:", string(body))
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	fmt.Println("[RecommendMove] API request successful")

	var chatResponse ChatResponse
	err = json.Unmarshal(body, &chatResponse)
	if err != nil {
		fmt.Println("[RecommendMove] ERROR: failed to parse response:", err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResponse.Choices) == 0 {
		fmt.Println("[RecommendMove] ERROR: no choices in response")
		return nil, fmt.Errorf("no response from API")
	}

	// Parse the AI's JSON response
	aiContent := chatResponse.Choices[0].Message.Content
	fmt.Println("[RecommendMove] AI response:", aiContent)

	var recommendResponse RecommendMoveResponse
	err = json.Unmarshal([]byte(aiContent), &recommendResponse)
	if err != nil {
		fmt.Println("[RecommendMove] ERROR: failed to parse AI JSON:", err)
		return nil, fmt.Errorf("failed to parse AI recommendations: %w. Response: %s", err, aiContent)
	}

	fmt.Println("[RecommendMove] Successfully parsed", len(recommendResponse.Paths), "recommendations")
	return &recommendResponse, nil
}

// collectFolders recursively collects folder paths, stopping at project boundaries
func collectFolders(rootPath string, maxDepth int) []string {
	var folders []string
	collectFoldersRecursive(rootPath, 0, maxDepth, &folders)
	return folders
}

func collectFoldersRecursive(path string, currentDepth int, maxDepth int, folders *[]string) {
	if currentDepth > maxDepth {
		return
	}

	items, err := os.ReadDir(path)
	if err != nil {
		return
	}

	// Check if this folder is a project (has project indicators)
	isProject := false
	for _, item := range items {
		if entity.IsProjectIndicator(item.Name()) {
			isProject = true
			break
		}
	}

	// Add this folder to the list
	*folders = append(*folders, path)

	// If this is a project folder, don't recurse into children
	if isProject {
		return
	}

	// Recurse into subdirectories
	for _, item := range items {
		if !item.IsDir() {
			continue
		}
		if entity.IsBlocked(item.Name()) {
			continue
		}
		collectFoldersRecursive(filepath.Join(path, item.Name()), currentDepth+1, maxDepth, folders)
	}
}
