package main

import (
	"context"
	"fmt"
	"os"
	"Finder-2/backend"
	"Finder-2/backend/filter"
	"Finder-2/backend/open"
	"Finder-2/backend/search"
	contextmenu "Finder-2/backend/context-menu"
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
