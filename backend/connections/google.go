package connections

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"Finder-2/backend/database"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

var (
	googleOAuthConfig *oauth2.Config
	oauthStateString  = "random-state-string" // In production, generate random state
)

// InitGoogleOAuth initializes the Google OAuth configuration
func InitGoogleOAuth(clientID, clientSecret string) {
	googleOAuthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://localhost:8080/auth/google/callback",
		Scopes: []string{
			drive.DriveFileScope,     // Access to files created by this app
			drive.DriveMetadataScope, // Read file metadata
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}
}

// StartGoogleLogin opens the browser for user to login
func StartGoogleLogin() string {
	if googleOAuthConfig == nil {
		log.Println("Google OAuth not initialized")
		return ""
	}

	// Start callback server
	if err := StartCallbackServer(); err != nil {
		log.Println("Error starting callback server:", err)
		return ""
	}

	// Generate the authorization URL
	// AccessTypeOffline requests a refresh token
	// ApprovalForce forces the consent screen even if already authorized (ensures we get a refresh token)
	url := googleOAuthConfig.AuthCodeURL(oauthStateString,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce)
	return url
}

// LoginAndWait performs the complete login flow and waits for completion
func LoginAndWait() error {
	// Start the callback server
	if err := StartCallbackServer(); err != nil {
		return err
	}

	// Generate the auth URL
	authURL := StartGoogleLogin()
	if authURL == "" {
		StopCallbackServer()
		return fmt.Errorf("failed to generate auth URL")
	}

	log.Println("Opening browser for Google login...")
	log.Println("Auth URL:", authURL)

	// Wait for the callback
	return WaitForCallback()
}

// HandleGoogleCallback processes the OAuth callback and stores tokens
func HandleGoogleCallback(code string) error {
	if googleOAuthConfig == nil {
		return fmt.Errorf("google OAuth not initialized")
	}

	// Exchange code for token
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		return fmt.Errorf("failed to exchange code: %v", err)
	}

	log.Println("Token received from Google:")
	log.Println("  - Access Token:", token.AccessToken[:20]+"...")
	log.Println("  - Refresh Token:", token.RefreshToken)
	log.Println("  - Expiry:", token.Expiry)

	// Get user email
	email, err := getUserEmail(token)
	if err != nil {
		log.Println("Warning: could not get user email:", err)
		email = "unknown"
	}

	// Save to keychain
	authData := database.GoogleAuthData{
		RefreshToken: token.RefreshToken,
		AccessToken:  token.AccessToken,
		Email:        email,
		ExpiresAt:    token.Expiry.Unix(),
	}

	log.Println("Saving to keychain:")
	log.Println("  - Refresh Token:", authData.RefreshToken)
	log.Println("  - Email:", authData.Email)

	if err := database.SaveGoogleAuth(authData); err != nil {
		return fmt.Errorf("failed to save auth: %v", err)
	}

	log.Println("Successfully authenticated with Google as", email)
	return nil
}

// getUserEmail fetches the user's email from Google
func getUserEmail(token *oauth2.Token) (string, error) {
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var userInfo struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return "", err
	}

	return userInfo.Email, nil
}

// GetGoogleClient returns an authenticated Google API client
func GetGoogleClient() (*http.Client, error) {
	authData, err := database.GetGoogleAuth()
	if err != nil {
		return nil, err
	}

	if authData == nil {
		return nil, fmt.Errorf("not connected to Google")
	}

	token := &oauth2.Token{
		AccessToken:  authData.AccessToken,
		RefreshToken: authData.RefreshToken,
		Expiry:       time.Unix(authData.ExpiresAt, 0),
	}

	// This will automatically refresh the token if expired
	return googleOAuthConfig.Client(context.Background(), token), nil
}

// DisconnectGoogle removes Google authentication
func DisconnectGoogle() error {
	return database.DeleteGoogleAuth()
}

// IsGoogleConnected checks if user is connected
func IsGoogleConnected() bool {
	return database.IsGoogleConnected()
}

// GetConnectedEmail returns the email of the connected Google account
func GetConnectedEmail() string {
	authData, err := database.GetGoogleAuth()
	if err != nil || authData == nil {
		return ""
	}
	return authData.Email
}

// GoogleFile represents a file from Google Drive
type GoogleFile struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	MimeType string `json:"mimeType"`
	WebLink  string `json:"webLink"`
}

// ListGoogleDocs fetches all Google Docs files from the user's Drive
func ListGoogleDocs() ([]GoogleFile, error) {
	client, err := GetGoogleClient()
	if err != nil {
		return nil, fmt.Errorf("failed to get Google client: %v", err)
	}

	srv, err := drive.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create Drive service: %v", err)
	}

	// Query for Google Docs, Sheets, and Slides
	query := "mimeType='application/vnd.google-apps.document' or " +
		"mimeType='application/vnd.google-apps.spreadsheet' or " +
		"mimeType='application/vnd.google-apps.presentation'"

	fileList, err := srv.Files.List().
		Q(query).
		Fields("files(id, name, mimeType, webViewLink)").
		PageSize(100).
		Do()

	if err != nil {
		return nil, fmt.Errorf("failed to list files: %v", err)
	}

	var files []GoogleFile
	for _, f := range fileList.Files {
		files = append(files, GoogleFile{
			ID:       f.Id,
			Name:     f.Name,
			MimeType: f.MimeType,
			WebLink:  f.WebViewLink,
		})
	}

	return files, nil
}
