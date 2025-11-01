package database

import (
	"database/sql"
	"log"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// Init initializes the database connection
func Init(appDataPath string) error {
	// Store DB in app data directory
	dbPath := filepath.Join(appDataPath, "finder.db")

	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Test connection
	if err = DB.Ping(); err != nil {
		return err
	}

	log.Println("Database connected:", dbPath)

	// Run migrations
	return RunMigrations()
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
