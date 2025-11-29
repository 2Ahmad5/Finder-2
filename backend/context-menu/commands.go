package contextmenu

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
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

	// If file already exists in trash, add a number suffix
	if _, err := os.Stat(trashPath); err == nil {
		ext := filepath.Ext(fileName)
		nameWithoutExt := fileName[:len(fileName)-len(ext)]
		counter := 1
		for {
			newName := fmt.Sprintf("%s %d%s", nameWithoutExt, counter, ext)
			trashPath = filepath.Join(trashDir, newName)
			if _, err := os.Stat(trashPath); os.IsNotExist(err) {
				break
			}
			counter++
		}
	}

	return os.Rename(path, trashPath)
}

func RenameFile(oldPath string, newName string) error {
	dir := filepath.Dir(oldPath)
	newPath := filepath.Join(dir, newName)
	return os.Rename(oldPath, newPath)
}

func CreateFile(directory string, name string) error {
	filePath := filepath.Join(directory, name)
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	return file.Close()
}

func CreateFolder(directory string, name string) error {
	folderPath := filepath.Join(directory, name)
	return os.Mkdir(folderPath, 0755)
}

func Zip(path string) error {
	// Get the base name for the zip file
	baseName := filepath.Base(path)
	dir := filepath.Dir(path)
	zipPath := filepath.Join(dir, baseName+".zip")

	// Handle duplicate zip names
	if _, err := os.Stat(zipPath); err == nil {
		counter := 1
		for {
			zipPath = filepath.Join(dir, fmt.Sprintf("%s %d.zip", baseName, counter))
			if _, err := os.Stat(zipPath); os.IsNotExist(err) {
				break
			}
			counter++
		}
	}

	// Create the zip file
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	w := zip.NewWriter(zipFile)
	defer w.Close()

	// Check if path is a file or directory
	info, err := os.Stat(path)
	if err != nil {
		return err
	}

	if info.IsDir() {
		// Walk the directory
		return filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Get relative path
			relPath, err := filepath.Rel(filepath.Dir(path), filePath)
			if err != nil {
				return err
			}

			if info.IsDir() {
				// Add directory entry
				_, err := w.Create(relPath + "/")
				return err
			}

			// Create file entry
			f, err := w.Create(relPath)
			if err != nil {
				return err
			}

			// Open and copy file contents
			file, err := os.Open(filePath)
			if err != nil {
				return err
			}
			defer file.Close()

			_, err = io.Copy(f, file)
			return err
		})
	} else {
		// Single file
		f, err := w.Create(baseName)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(f, file)
		return err
	}
}

func UnZip(zipPath string) error {
	// Open the zip file
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	// Get the directory where the zip file is located
	destDir := filepath.Dir(zipPath)

	for _, f := range r.File {
		// Construct the full path for the file
		fpath := filepath.Join(destDir, f.Name)

		// Check for ZipSlip vulnerability
		if !strings.HasPrefix(fpath, filepath.Clean(destDir)+string(os.PathSeparator)) {
			return fmt.Errorf("invalid file path: %s", fpath)
		}

		if f.FileInfo().IsDir() {
			// Create directory
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}

		// Create parent directories if needed
		if err = os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return err
		}

		// Create the file
		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()

		if err != nil {
			return err
		}
	}

	return nil
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
