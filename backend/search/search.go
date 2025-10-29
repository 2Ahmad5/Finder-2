package search

import (
	"Finder-2/backend"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type SearchResult struct {
	FileItem    backend.FileItem `json:"fileItem"`
	MatchType   string           `json:"matchType"`   // "filename"
	MatchedLine string           `json:"matchedLine"` // Not used for filename searches
}

// Search searches for files by name using fd (extremely fast and reliable)
func Search(directory string, query string) ([]SearchResult, error) {
	return fdSearch(directory, query)
}

// SearchFilenames is an alias for Search for backward compatibility
func SearchFilenames(directory string, query string) ([]SearchResult, error) {
	return fdSearch(directory, query)
}

// fdSearch uses fd to search for files by name (extremely fast)
func fdSearch(directory string, query string) ([]SearchResult, error) {
	var results []SearchResult

	// Use fd to search for files with optimizations
	// -i: case insensitive
	// --exclude: exclude common slow directories
	cmd := exec.Command("fd", "-i",
		"--exclude", "Library",
		"--exclude", "node_modules",
		"--exclude", ".git",
		"--exclude", "Cache",
		"--exclude", "Caches",
		query, directory)
	output, err := cmd.Output()
	if err != nil {
		// fd returns exit code 1 if no matches found
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			return results, nil
		}
		return results, err
	}

	// Parse fd output (one file path per line)
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}

		// Get file info
		info, err := os.Stat(line)
		if err != nil {
			continue
		}

		fileItem := backend.FileItem{
			Name:         filepath.Base(line),
			Path:         line,
			IsDirectory:  info.IsDir(),
			IsApp:        strings.HasSuffix(line, ".app"),
			Size:         info.Size(),
			ModifiedTime: info.ModTime().Format("2006-01-02T15:04:05Z07:00"),
			IconPath:     "",
		}

		results = append(results, SearchResult{
			FileItem:  fileItem,
			MatchType: "filename",
		})
	}

	return results, nil
}
