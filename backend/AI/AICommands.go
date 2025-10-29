package AI

import (
	"fmt"
	"os"
	"path/filepath"
)

// CreateFolder creates a new folder at the specified path with the given name
func CreateFolder(path string, name string) error {
	fullPath := filepath.Join(path, name)

	if _, err := os.Stat(fullPath); err == nil {
		return fmt.Errorf("folder already exists: %s", fullPath)
	}

	err := os.Mkdir(fullPath, 0755)
	if err != nil {
		return fmt.Errorf("failed to create folder: %w", err)
	}

	return nil
}

func CreateFile(path string, name string) error {
	fullPath := filepath.Join(path, name)

	if _, err := os.Stat(fullPath); err == nil {
		return fmt.Errorf("file already exists: %s", fullPath)
	}

	file, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	return nil
}
