package backend

import (
	"Finder-2/backend/icon"
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileItem struct {
	Name         string `json:"name"`
	Path         string `json:"path"`
	IsDirectory  bool   `json:"isDirectory"`
	IsApp        bool   `json:"isApp"`
	Size         int64  `json:"size"`
	ModifiedTime string `json:"modifiedTime"`
	IconPath     string `json:"iconPath"`
}

type Folder struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Icon string `json:"icon"`
}

var blocklist = []string{
	"node_modules",
	".git",
	"__pycache__",
	".vscode",
	".idea",
	"dist",
	"build",
	".next",
	".DS_Store",
	".localized",
	"Utilities",
}

var systemFolders = []string{
	"Chrome Apps.Localized",
}

func isBlocked(name string) bool {
	for _, blocked := range blocklist {
		if name == blocked {
			return true
		}
	}
	for _, sysFolder := range systemFolders {
		if name == sysFolder {
			return true
		}
	}
	if len(name) > 0 && name[0] == '.' {
		return true
	}
	return false
}

func GetHomeFolders() ([]Folder, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	var folders []Folder

	// Add system Applications folder
	folders = append(folders, Folder{
		Name: "Applications",
		Path: "/Applications",
		Icon: "folder",
	})

	// Add Documents
	folders = append(folders, Folder{
		Name: "Documents",
		Path: filepath.Join(homeDir, "Documents"),
		Icon: "folder",
	})

	// Add Downloads
	folders = append(folders, Folder{
		Name: "Downloads",
		Path: filepath.Join(homeDir, "Downloads"),
		Icon: "folder",
	})

	// Add Media (virtual folder that will show Pictures, Music, Movies)
	folders = append(folders, Folder{
		Name: "Media",
		Path: "media://",
		Icon: "folder",
	})

	return folders, nil
}

func GetFolderContents(path string) ([]FileItem, error) {
	// Handle special "Media" virtual folder
	if path == "media://" {
		return getMediaFolderContents()
	}

	items, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var fileItems []FileItem
	for _, item := range items {
		if isBlocked(item.Name()) {
			continue
		}

		info, err := item.Info()
		if err != nil {
			continue
		}

		isApp := strings.HasSuffix(item.Name(), ".app")
		iconPath := ""
		// Try to get icon for .app files OR any directory in Applications folder
		itemPath := filepath.Join(path, item.Name())
		if isApp || (item.IsDir() && (path == "/Applications" || strings.HasSuffix(path, "/Applications"))) {
			iconPath = icon.GetAppIconBase64(itemPath)
		}

		fileItems = append(fileItems, FileItem{
			Name:         item.Name(),
			Path:         filepath.Join(path, item.Name()),
			IsDirectory:  item.IsDir(),
			IsApp:        isApp,
			Size:         info.Size(),
			ModifiedTime: info.ModTime().Format(time.RFC3339),
			IconPath:     iconPath,
		})
	}

	return fileItems, nil
}

// getMediaFolderContents returns the virtual contents of the Media folder
// (Pictures, Music, Movies from user's home directory)
func getMediaFolderContents() ([]FileItem, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	var fileItems []FileItem
	mediaFolders := []struct {
		name string
		path string
	}{
		{"Pictures", filepath.Join(homeDir, "Pictures")},
		{"Music", filepath.Join(homeDir, "Music")},
		{"Movies", filepath.Join(homeDir, "Movies")},
	}

	for _, folder := range mediaFolders {
		info, err := os.Stat(folder.path)
		if err != nil {
			// Skip if folder doesn't exist
			continue
		}

		fileItems = append(fileItems, FileItem{
			Name:         folder.name,
			Path:         folder.path,
			IsDirectory:  true,
			IsApp:        false,
			Size:         info.Size(),
			ModifiedTime: info.ModTime().Format(time.RFC3339),
			IconPath:     "",
		})
	}

	return fileItems, nil
}

// ReadFileContent reads a file and returns its content as base64 for binary files
// or as plain text for text files
func ReadFileContent(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	// For now, return everything as base64 to handle all file types
	encoded := base64.StdEncoding.EncodeToString(data)
	return encoded, nil
}
