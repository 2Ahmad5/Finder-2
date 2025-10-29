package icon

import (
	"encoding/base64"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
)

// Cache for icon data
var (
	iconCache = make(map[string]string)
	cacheMux  sync.RWMutex
)

func getIconFileName(content string, key string) string {
	iconStart := strings.Index(content, key)
	if iconStart == -1 {
		return ""
	}

	// Find the next <string> tag
	stringStart := strings.Index(content[iconStart:], "<string>")
	if stringStart == -1 {
		return ""
	}
	stringStart += iconStart + 8 // Move past "<string>"

	stringEnd := strings.Index(content[stringStart:], "</string>")
	if stringEnd == -1 {
		return ""
	}

	return strings.TrimSpace(content[stringStart : stringStart+stringEnd])
}

func GetAppIconPath(appPath string) string {
	// Read the Info.plist to get the icon file name
	infoPlistPath := filepath.Join(appPath, "Contents", "Info.plist")
	data, err := os.ReadFile(infoPlistPath)
	if err != nil {
		return ""
	}

	content := string(data)
	resourcesPath := filepath.Join(appPath, "Contents", "Resources")

	// Try CFBundleIconFile first
	iconFileName := getIconFileName(content, "<key>CFBundleIconFile</key>")

	// Try CFBundleIconName if CFBundleIconFile not found
	if iconFileName == "" {
		iconFileName = getIconFileName(content, "<key>CFBundleIconName</key>")
	}

	// If we found an icon name, try different variations
	if iconFileName != "" {
		// Try with .icns extension
		if !strings.HasSuffix(iconFileName, ".icns") {
			testPath := filepath.Join(resourcesPath, iconFileName+".icns")
			if _, err := os.Stat(testPath); err == nil {
				return testPath
			}
		}

		// Try without adding extension (might already have it)
		testPath := filepath.Join(resourcesPath, iconFileName)
		if _, err := os.Stat(testPath); err == nil {
			return testPath
		}

		// Try looking in Assets.car or icon sets
		assetPath := filepath.Join(resourcesPath, "Assets.car")
		if _, err := os.Stat(assetPath); err == nil {
			// For now, try common icon names in the Resources folder
			commonIcons := []string{"AppIcon.icns", "app.icns", "icon.icns", "Icon.icns"}
			for _, icon := range commonIcons {
				testPath := filepath.Join(resourcesPath, icon)
				if _, err := os.Stat(testPath); err == nil {
					return testPath
				}
			}
		}
	}

	// Last resort: try to find any .icns file in Resources
	entries, err := os.ReadDir(resourcesPath)
	if err == nil {
		for _, entry := range entries {
			if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".icns") {
				return filepath.Join(resourcesPath, entry.Name())
			}
		}
	}

	return ""
}

func extractIconWithOSAScript(appPath string, outputPath string) error {
	script := `
use framework "AppKit"
use framework "Foundation"

on run argv
    set appPath to item 1 of argv
    set outputPath to item 2 of argv

    set workspace to current application's NSWorkspace's sharedWorkspace()
    set icon to workspace's iconForFile:appPath

    if icon is not missing value then
        icon's setSize:{128, 128}
        set tiffData to icon's TIFFRepresentation()
        set bitmap to current application's NSBitmapImageRep's imageRepWithData:tiffData
        set pngData to bitmap's representationUsingType:4 |properties|:(missing value)
        pngData's writeToFile:outputPath atomically:true
        return "success"
    end if
    return "failed"
end run
`

	cmd := exec.Command("osascript", "-l", "AppleScript", "-e", script, appPath, outputPath)
	return cmd.Run()
}

func GetAppIconBase64(appPath string) string {
	// Check cache first
	cacheMux.RLock()
	cached, exists := iconCache[appPath]
	cacheMux.RUnlock()

	if exists {
		return cached
	}

	// Extract icon
	tmpFile := filepath.Join(os.TempDir(), "icon-"+filepath.Base(appPath)+".png")
	defer os.Remove(tmpFile)

	var result string

	iconPath := GetAppIconPath(appPath)

	if iconPath != "" {
		// Convert .icns to PNG using sips at higher resolution for retina displays
		cmd := exec.Command("sips", "-s", "format", "png", iconPath, "--out", tmpFile, "-z", "128", "128")
		if err := cmd.Run(); err == nil {
			// Read the PNG file
			pngData, err := os.ReadFile(tmpFile)
			if err == nil {
				// Convert to base64
				result = "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData)
			}
		}
	}

	// Fallback: Use AppleScript to extract icon using NSWorkspace
	// This works for all apps including those with asset catalogs
	if result == "" {
		if err := extractIconWithOSAScript(appPath, tmpFile); err == nil {
			pngData, err := os.ReadFile(tmpFile)
			if err == nil {
				result = "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData)
			}
		}
	}

	// Cache the result (even if empty to avoid repeated lookups)
	cacheMux.Lock()
	iconCache[appPath] = result
	cacheMux.Unlock()

	return result
}
