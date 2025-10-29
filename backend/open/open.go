package open

import (
	"os/exec"
	"strings"
)

func OpenFile(path string) error {
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
