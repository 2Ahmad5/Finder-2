package contextmenu

import (
	"io"
	"os"
	"path/filepath"
)

type ClipboardItem struct {
	Path      string
	Operation string
}

var clipboard *ClipboardItem

func CopyFile(path string) error {
	clipboard = &ClipboardItem{
		Path:      path,
		Operation: "copy",
	}
	return nil
}

func CutFile(path string) error {
	clipboard = &ClipboardItem{
		Path:      path,
		Operation: "cut",
	}
	return nil
}

func PasteFile(destinationDir string) error {
	if clipboard == nil {
		return nil
	}

	sourcePath := clipboard.Path
	fileName := filepath.Base(sourcePath)
	destPath := filepath.Join(destinationDir, fileName)

	if clipboard.Operation == "copy" {
		err := copyFile(sourcePath, destPath)
		if err != nil {
			return err
		}
	} else if clipboard.Operation == "cut" {
		err := os.Rename(sourcePath, destPath)
		if err != nil {
			return err
		}
		clipboard = nil
	}

	return nil
}

func HasClipboardContent() bool {
	return clipboard != nil
}

func TrashFile(path string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	trashDir := filepath.Join(homeDir, ".Trash")
	fileName := filepath.Base(path)
	trashPath := filepath.Join(trashDir, fileName)

	return os.Rename(path, trashPath)
}

func RenameFile(oldPath string, newName string) error {
	dir := filepath.Dir(oldPath)
	newPath := filepath.Join(dir, newName)
	return os.Rename(oldPath, newPath)
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	return os.Chmod(dst, sourceInfo.Mode())
}
