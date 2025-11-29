package open

import (
	"os/exec"
	"strings"

	"Finder-2/backend/google"
)

func OpenFile(path string) error {
	// Check if this is a .goox file (Google Doc pointer)
	if strings.HasSuffix(path, ".goox") {
		return google.OpenGoogleDoc(path)
	}

	cmd := exec.Command("open", path)
	return cmd.Run()
}

func OpenApplication(path string) error {
	if !strings.HasSuffix(path, ".app") {
		return OpenFile(path)
	}
	cmd := exec.Command("open", "-a", path)
	return cmd.Run()
}
