package database

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/zalando/go-keyring"
)

const (
	serviceName = "Finder-2"
	googleUser  = "google-oauth"
)

// GoogleAuthData stores Google OAuth tokens
type GoogleAuthData struct {
	RefreshToken string `json:"refresh_token"`
	AccessToken  string `json:"access_token"`
	Email        string `json:"email"`
	ExpiresAt    int64  `json:"expires_at"` // Unix timestamp
}

// SaveGoogleAuth stores Google OAuth tokens securely in keychain
func SaveGoogleAuth(authData GoogleAuthData) error {
	jsonData, err := json.Marshal(authData)
	if err != nil {
		return err
	}

	return keyring.Set(serviceName, googleUser, string(jsonData))
}

// GetGoogleAuth retrieves Google OAuth tokens from keychain
func GetGoogleAuth() (*GoogleAuthData, error) {
	jsonData, err := keyring.Get(serviceName, googleUser)
	if err != nil {
		if errors.Is(err, keyring.ErrNotFound) {
			return nil, nil // Not an error, just not connected yet
		}
		return nil, err
	}

	var authData GoogleAuthData
	if err := json.Unmarshal([]byte(jsonData), &authData); err != nil {
		return nil, err
	}

	return &authData, nil
}

// DeleteGoogleAuth removes Google OAuth tokens from keychain
func DeleteGoogleAuth() error {
	err := keyring.Delete(serviceName, googleUser)
	if err != nil && !errors.Is(err, keyring.ErrNotFound) {
		return err
	}
	return nil
}

// IsGoogleConnected checks if user has connected their Google account
func IsGoogleConnected() bool {
	log.Println("IsGoogleConnected called")
	authData, err := GetGoogleAuth()
	if err != nil {
		log.Println("IsGoogleConnected: error from GetGoogleAuth:", err)
		return false
	}
	if authData == nil {
		log.Println("IsGoogleConnected: authData is nil")
		return false
	}
	if authData.RefreshToken == "" {
		log.Println("IsGoogleConnected: refresh token is empty")
		return false
	}
	log.Println("IsGoogleConnected: YES - connected as", authData.Email)
	return true
}

// GetGoogleRefreshToken returns just the refresh token (for convenience)
func GetGoogleRefreshToken() (string, error) {
	authData, err := GetGoogleAuth()
	if err != nil {
		return "", err
	}
	if authData == nil {
		return "", errors.New("not connected to Google")
	}
	return authData.RefreshToken, nil
}
