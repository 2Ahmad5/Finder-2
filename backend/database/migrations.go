package database

// RunMigrations creates all necessary tables
func RunMigrations() error {
	schema := `
	CREATE TABLE IF NOT EXISTS external_files (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT NOT NULL,
		path TEXT NOT NULL UNIQUE,
		file_id TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_type ON external_files(type);
	CREATE INDEX IF NOT EXISTS idx_path ON external_files(path);
	CREATE INDEX IF NOT EXISTS idx_file_id ON external_files(file_id);
	`

	_, err := DB.Exec(schema)
	return err
}
