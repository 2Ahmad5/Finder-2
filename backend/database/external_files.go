package database

import (
	"database/sql"
	"time"
)

type ExternalFile struct {
	ID        int       `json:"id"`
	Type      string    `json:"type"`      
	Path      string    `json:"path"`      
	FileID    string    `json:"fileId"`    
	CreatedAt time.Time `json:"createdAt"`
}

func AddExternalFile(fileType, path, fileID string) error {
	query := `
		INSERT INTO external_files (type, path, file_id)
		VALUES (?, ?, ?)
	`
	_, err := DB.Exec(query, fileType, path, fileID)
	return err
}

func GetExternalFileByPath(path string) (*ExternalFile, error) {
	query := `
		SELECT id, type, path, file_id, created_at
		FROM external_files
		WHERE path = ?
	`

	var file ExternalFile
	err := DB.QueryRow(query, path).Scan(
		&file.ID,
		&file.Type,
		&file.Path,
		&file.FileID,
		&file.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return &file, err
}

func GetExternalFileByID(fileID string) (*ExternalFile, error) {
	query := `
		SELECT id, type, path, file_id, created_at
		FROM external_files
		WHERE file_id = ?
	`

	var file ExternalFile
	err := DB.QueryRow(query, fileID).Scan(
		&file.ID,
		&file.Type,
		&file.Path,
		&file.FileID,
		&file.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return &file, err
}

func ListExternalFilesByType(fileType string) ([]ExternalFile, error) {
	query := `
		SELECT id, type, path, file_id, created_at
		FROM external_files
		WHERE type = ?
		ORDER BY created_at DESC
	`

	rows, err := DB.Query(query, fileType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []ExternalFile
	for rows.Next() {
		var file ExternalFile
		err := rows.Scan(
			&file.ID,
			&file.Type,
			&file.Path,
			&file.FileID,
			&file.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		files = append(files, file)
	}

	return files, nil
}

func UpdateExternalFilePath(oldPath, newPath string) error {
	query := `UPDATE external_files SET path = ? WHERE path = ?`
	_, err := DB.Exec(query, newPath, oldPath)
	return err
}

func DeleteExternalFile(path string) error {
	query := `DELETE FROM external_files WHERE path = ?`
	_, err := DB.Exec(query, path)
	return err
}

func IsExternalFile(path string) bool {
	file, err := GetExternalFileByPath(path)
	return err == nil && file != nil
}
