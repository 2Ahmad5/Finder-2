package share

import (
	"context"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"strings"

	"Finder-2/backend/connections"
	"Finder-2/backend/database"

	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)


func ShareFileViaEmail(filePath string, recipientEmail string) error {
	log.Printf("Sharing file %s with %s", filePath, recipientEmail)

	// Get Google auth data
	authData, err := database.GetGoogleAuth()
	if err != nil {
		return fmt.Errorf("failed to get Google auth: %v", err)
	}
	if authData == nil {
		return fmt.Errorf("not connected to Google. Please connect your Google account first")
	}

	// Get authenticated Google client
	client, err := connections.GetGoogleClient()
	if err != nil {
		return fmt.Errorf("failed to get Google client: %v", err)
	}

	// Create Gmail service
	gmailService, err := gmail.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return fmt.Errorf("failed to create Gmail service: %v", err)
	}

	// Read the file
	fileContent, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	// Get filename
	fileName := filepath.Base(filePath)

	// Create email message with attachment
	message, err := createEmailWithAttachment(authData.Email, recipientEmail, fileName, fileContent)
	if err != nil {
		return fmt.Errorf("failed to create email: %v", err)
	}

	// Send the email
	_, err = gmailService.Users.Messages.Send("me", message).Do()
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Successfully sent %s to %s", fileName, recipientEmail)
	return nil
}

// createEmailWithAttachment creates a Gmail message with a file attachment
func createEmailWithAttachment(fromEmail, toEmail, fileName string, fileContent []byte) (*gmail.Message, error) {
	// Encode file content to base64
	fileData := base64.StdEncoding.EncodeToString(fileContent)

	// Determine MIME type based on file extension
	mimeType := getMimeType(fileName)

	// Create message boundary
	boundary := "boundary123456789"

	// Build the email message
	messageBody := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Shared file: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: multipart/mixed; boundary=%s\r\n\r\n"+
			"--%s\r\n"+
			"Content-Type: text/plain; charset=UTF-8\r\n\r\n"+
			"I'm sharing the file '%s' with you.\r\n\r\n"+
			"--%s\r\n"+
			"Content-Type: %s; name=\"%s\"\r\n"+
			"Content-Disposition: attachment; filename=\"%s\"\r\n"+
			"Content-Transfer-Encoding: base64\r\n\r\n"+
			"%s\r\n"+
			"--%s--",
		fromEmail,
		toEmail,
		fileName,
		boundary,
		boundary,
		fileName,
		boundary,
		mimeType,
		fileName,
		fileName,
		fileData,
		boundary,
	)

	// Encode the entire message to base64
	encodedMessage := base64.URLEncoding.EncodeToString([]byte(messageBody))

	return &gmail.Message{
		Raw: encodedMessage,
	}, nil
}

// getMimeType returns the MIME type based on file extension
func getMimeType(fileName string) string {
	ext := strings.ToLower(filepath.Ext(fileName))

	mimeTypes := map[string]string{
		".txt":  "text/plain",
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".zip":  "application/zip",
		".mp3":  "audio/mpeg",
		".mp4":  "video/mp4",
		".json": "application/json",
		".xml":  "application/xml",
		".csv":  "text/csv",
		".html": "text/html",
		".css":  "text/css",
		".js":   "application/javascript",
		".go":   "text/plain",
		".py":   "text/plain",
	}

	if mimeType, ok := mimeTypes[ext]; ok {
		return mimeType
	}

	return "application/octet-stream" 
}
