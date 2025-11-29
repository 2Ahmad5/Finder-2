package database

import (
	"encoding/json"
	"errors"
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
	ExpiresAt    int64  `json:"expires_at"`
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
			return nil, nil
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
	authData, err := GetGoogleAuth()
	return err == nil && authData != nil && authData.RefreshToken != ""
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
