package global

import (
	"os"
	"path/filepath"
	"strings"
)


func GoUpDirectory(currentPath string, homeDir string) string {
	// Don't navigate up if path is empty
	if currentPath == "" {
		return ""
	}

	// List of top-level folders we don't want to go above
	topLevelFolders := []string{
		filepath.Join(homeDir, "Documents"),
		filepath.Join(homeDir, "Downloads"),
		filepath.Join(homeDir, "Applications"),
		filepath.Join(homeDir, "Media"),
	}

	// Check if we're at a top-level folder
	for _, topFolder := range topLevelFolders {
		if currentPath == topFolder {
			return "" // Don't go up
		}
	}

	// Get parent directory
	parentPath := filepath.Dir(currentPath)

	// Don't go above home directory
	if !strings.HasPrefix(parentPath, homeDir) {
		return ""
	}

	return parentPath
}

// GetHomeDirectory returns the user's home directory
func GetHomeDirectory() (string, error) {
	return os.UserHomeDir()
}
