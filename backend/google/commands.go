package google

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"Finder-2/backend/connections"
	"Finder-2/backend/database"

	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// CreateGoogleDoc creates a new Google Doc and a local .goox pointer file
func CreateGoogleDoc(directory string, name string) error {
	client, err := connections.GetGoogleClient()
	if err != nil {
		return fmt.Errorf("failed to get Google client: %v", err)
	}

	srv, err := drive.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return fmt.Errorf("failed to create Drive service: %v", err)
	}

	// Create a new Google Doc
	file := &drive.File{
		Name:     name,
		MimeType: "application/vnd.google-apps.document",
	}

	createdFile, err := srv.Files.Create(file).Fields("id, name, mimeType, webViewLink").Do()
	if err != nil {
		return fmt.Errorf("failed to create Google Doc: %v", err)
	}

	// Create the local .goox pointer file
	localPath := filepath.Join(directory, name+".goox")

	// Write the Google Doc ID to the file as a simple pointer
	err = os.WriteFile(localPath, []byte(createdFile.Id), 0644)
	if err != nil {
		return fmt.Errorf("failed to create local pointer file: %v", err)
	}

	// Store the mapping in the database
	err = database.AddExternalFile("google_doc", localPath, createdFile.Id)
	if err != nil {
		return fmt.Errorf("failed to save file mapping: %v", err)
	}

	return nil
}

// OpenGoogleDoc opens a .goox file by reading its Google Doc ID and opening in browser
func OpenGoogleDoc(path string) error {
	// First try to get from database
	externalFile, err := database.GetExternalFileByPath(path)
	if err != nil {
		return fmt.Errorf("failed to check database: %v", err)
	}

	var fileID string
	if externalFile != nil {
		fileID = externalFile.FileID
	} else {
		// Fallback: read the file ID directly from the file
		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read pointer file: %v", err)
		}
		fileID = string(content)
	}

	// Google Docs URL format
	url := fmt.Sprintf("https://docs.google.com/document/d/%s/edit", fileID)

	// Open in default browser using macOS open command
	cmd := exec.Command("open", url)
	return cmd.Run()
}
