package entity

import (
	"os"
	"path/filepath"
	"strings"
)

// FolderNode represents a folder in the tree structure for entity map
type FolderNode struct {
	Name      string       `json:"name"`
	Path      string       `json:"path"`
	IsProject bool         `json:"isProject"`
	Children  []FolderNode `json:"children"`
	FileCount int          `json:"fileCount"`
}

// Project indicator files - if a folder contains any of these, it's likely a project root
var projectIndicators = []string{
	".git",
	".env",
	".env.local",
	"package.json",
	"go.mod",
	"Cargo.toml",
	"requirements.txt",
	"Pipfile",
	"pyproject.toml",
	"Makefile",
	"Dockerfile",
	"docker-compose.yml",
	"docker-compose.yaml",
	".gitignore",
	"pom.xml",
	"build.gradle",
	"CMakeLists.txt",
	"Gemfile",
	"composer.json",
	"pubspec.yaml",
	"Package.swift",
	".project",
	"*.xcodeproj",
	"*.sln",
	"wails.json",
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

// GetFolderTree recursively builds a tree structure of folders
func GetFolderTree(rootPath string, maxDepth int) (*FolderNode, error) {
	return getFolderTreeRecursive(rootPath, 0, maxDepth)
}

func getFolderTreeRecursive(path string, currentDepth int, maxDepth int) (*FolderNode, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	node := &FolderNode{
		Name:      info.Name(),
		Path:      path,
		IsProject: false,
		Children:  []FolderNode{},
		FileCount: 0,
	}

	items, err := os.ReadDir(path)
	if err != nil {
		return node, nil // Return node even if we can't read contents
	}

	// Check if this folder is a project
	for _, item := range items {
		if IsProjectIndicator(item.Name()) {
			node.IsProject = true
			break
		}
	}

	// Count files and get subfolders
	for _, item := range items {
		if IsBlocked(item.Name()) {
			continue
		}

		if item.IsDir() {
			// If this is a project folder, don't recurse into children
			if node.IsProject {
				continue
			}

			// Check depth limit
			if currentDepth >= maxDepth {
				continue
			}

			childNode, err := getFolderTreeRecursive(filepath.Join(path, item.Name()), currentDepth+1, maxDepth)
			if err != nil {
				continue
			}
			node.Children = append(node.Children, *childNode)
		} else {
			node.FileCount++
		}
	}

	return node, nil
}

// IsProjectIndicator checks if a filename indicates a project root
func IsProjectIndicator(filename string) bool {
	for _, indicator := range projectIndicators {
		// Handle wildcard patterns like *.xcodeproj
		if strings.HasPrefix(indicator, "*") {
			suffix := indicator[1:]
			if strings.HasSuffix(filename, suffix) {
				return true
			}
		} else if filename == indicator {
			return true
		}
	}
	return false
}

// IsBlocked checks if a folder name should be skipped
func IsBlocked(name string) bool {
	for _, blocked := range blocklist {
		if name == blocked {
			return true
		}
	}
	if len(name) > 0 && name[0] == '.' {
		return true
	}
	return false
}
