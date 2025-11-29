package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"Finder-2/backend"
	"Finder-2/backend/AI"
	"Finder-2/backend/connections"
	"Finder-2/backend/database"
	"Finder-2/backend/filter"
	"Finder-2/backend/global"
	"Finder-2/backend/open"
	"Finder-2/backend/search"
	"Finder-2/backend/share"
	"Finder-2/backend/google"
	contextmenu "Finder-2/backend/context-menu"

	"github.com/joho/godotenv"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found")
	}

	// Initialize Google OAuth
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if clientID != "" && clientSecret != "" {
		connections.InitGoogleOAuth(clientID, clientSecret)
		fmt.Println("Google OAuth initialized")
	} else {
		fmt.Println("Warning: Google OAuth credentials not found in .env")
	}

	// Initialize database
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Println("Error getting home directory:", err)
		return
	}

	appDataPath := filepath.Join(homeDir, ".finder-2")
	if err := os.MkdirAll(appDataPath, 0755); err != nil {
		fmt.Println("Error creating app data directory:", err)
		return
	}

	if err := database.Init(appDataPath); err != nil {
		fmt.Println("Error initializing database:", err)
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	database.Close()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetHomeFolders() ([]backend.Folder, error) {
	return backend.GetHomeFolders()
}

func (a *App) GetFolderContents(path string) ([]backend.FileItem, error) {
	return backend.GetFolderContents(path)
}

func (a *App) GetAppIcon(iconPath string) (string, error) {
	if iconPath == "" {
		return "", nil
	}
	// For now, just return the path - we'll handle icon conversion later
	// macOS can display .icns files directly in some contexts
	return iconPath, nil
}

func (a *App) OpenFile(path string) error {
	return open.OpenFile(path)
}

func (a *App) OpenApplication(path string) error {
	return open.OpenApplication(path)
}

func (a *App) SortByName(items []backend.FileItem, ascending bool) []backend.FileItem {
	return filter.SortByName(items, ascending)
}

func (a *App) SortByDate(items []backend.FileItem, ascending bool) []backend.FileItem {
	return filter.SortByDate(items, ascending)
}

func (a *App) SortBySize(items []backend.FileItem, ascending bool) []backend.FileItem {
	return filter.SortBySize(items, ascending)
}

func (a *App) SearchFilenames(directory string, query string) ([]search.SearchResult, error) {
	return search.SearchFilenames(directory, query)
}

func (a *App) Search(directory string, query string) ([]search.SearchResult, error) {
	return search.Search(directory, query)
}

func (a *App) GetHomeDirectory() (string, error) {
	homeDir, err := os.UserHomeDir()
	return homeDir, err
}

func (a *App) CopyFile(path string) error {
	return contextmenu.CopyFile(path)
}

func (a *App) CutFile(path string) error {
	return contextmenu.CutFile(path)
}

func (a *App) PasteFile(destinationDir string) error {
	return contextmenu.PasteFile(destinationDir)
}

func (a *App) HasClipboardContent() bool {
	return contextmenu.HasClipboardContent()
}

func (a *App) TrashFile(path string) error {
	return contextmenu.TrashFile(path)
}

func (a *App) RenameFile(oldPath string, newName string) error {
	return contextmenu.RenameFile(oldPath, newName)
}

func (a *App) CreateFile(directory string, name string) error {
	return contextmenu.CreateFile(directory, name)
}

func (a *App) CreateFolder(directory string, name string) error {
	return contextmenu.CreateFolder(directory, name)
}

func (a *App) Zip(path string) error {
	return contextmenu.Zip(path)
}

func (a *App) UnZip(zipPath string) error {
	return contextmenu.UnZip(zipPath)
}

// AI Methods
func (a *App) GetAICommands(prompt string, currentPath string) ([]AI.Command, error) {
	return AI.GetAICommands(prompt, currentPath)
}

func (a *App) ExecuteAICommands(commands []AI.Command) []error {
	return AI.ExecuteCommands(commands)
}

func (a *App) GoUpDirectory(currentPath string) (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return global.GoUpDirectory(currentPath, homeDir), nil
}

func (a *App) ReadFileContent(filePath string) (string, error) {
	return backend.ReadFileContent(filePath)
}

// Google Authentication Methods
func (a *App) StartGoogleLogin() string {
	return connections.StartGoogleLogin()
}

func (a *App) HandleGoogleCallback(code string) error {
	return connections.HandleGoogleCallback(code)
}

func (a *App) IsGoogleConnected() bool {
	return connections.IsGoogleConnected()
}

func (a *App) GetGoogleEmail() string {
	return connections.GetConnectedEmail()
}

func (a *App) DisconnectGoogle() error {
	return connections.DisconnectGoogle()
}

func (a *App) ListGoogleDocs() ([]connections.GoogleFile, error) {
	return connections.ListGoogleDocs()
}

func (a *App) ListGmailMessages() ([]connections.GmailMessage, error) {
	return connections.ListGmailMessages()
}

func (a *App) ShareFile(filePath string, recipientEmail string) error {
	return share.ShareFileViaEmail(filePath, recipientEmail)
}

// Google Docs Methods
func (a *App) CreateGoogleDoc(directory string, name string) error {
	return google.CreateGoogleDoc(directory, name)
}
