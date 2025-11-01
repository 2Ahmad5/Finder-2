package connections

import (
	"fmt"
	"log"
	"net/http"
	"sync"
)

var (
	callbackServer *http.Server
	serverMutex    sync.Mutex
	callbackCode   string
	callbackError  error
	callbackDone   chan bool
)

// StartCallbackServer starts a temporary HTTP server to handle OAuth callback
func StartCallbackServer() error {
	serverMutex.Lock()
	defer serverMutex.Unlock()

	if callbackServer != nil {
		return fmt.Errorf("callback server already running")
	}

	callbackDone = make(chan bool, 1)

	mux := http.NewServeMux()
	mux.HandleFunc("/auth/google/callback", handleCallback)

	callbackServer = &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	go func() {
		log.Println("Starting OAuth callback server on :8080")
		if err := callbackServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Callback server error: %v", err)
		}
	}()

	return nil
}

// StopCallbackServer stops the callback server
func StopCallbackServer() {
	serverMutex.Lock()
	defer serverMutex.Unlock()

	if callbackServer != nil {
		callbackServer.Close()
		callbackServer = nil
	}
}

// handleCallback handles the OAuth callback from Google
func handleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	errMsg := r.URL.Query().Get("error")

	if errMsg != "" {
		callbackError = fmt.Errorf("google auth error: %s", errMsg)
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
			<html>
			<body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
				<h1 style="color: #d32f2f;">Authentication Failed</h1>
				<p>Error: %s</p>
				<p>You can close this window now.</p>
			</body>
			</html>
		`, errMsg)
		callbackDone <- true
		return
	}

	if code == "" {
		callbackError = fmt.Errorf("no authorization code received")
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
			<html>
			<body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
				<h1 style="color: #d32f2f;">Authentication Failed</h1>
				<p>No authorization code received</p>
				<p>You can close this window now.</p>
			</body>
			</html>
		`)
		callbackDone <- true
		return
	}

	// Process the callback
	err := HandleGoogleCallback(code)
	if err != nil {
		callbackError = err
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
			<html>
			<body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
				<h1 style="color: #d32f2f;">Authentication Failed</h1>
				<p>Error: %s</p>
				<p>You can close this window now.</p>
			</body>
			</html>
		`, err.Error())
	} else {
		callbackCode = code
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
			<html>
			<body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
				<h1 style="color: #4caf50;">✓ Authentication Successful!</h1>
				<p>You have successfully connected your Google account.</p>
				<p>You can close this window now and return to the app.</p>
			</body>
			</html>
		`)
	}

	callbackDone <- true
}

// WaitForCallback waits for the OAuth callback to complete
func WaitForCallback() error {
	if callbackDone == nil {
		return fmt.Errorf("callback server not started")
	}

	<-callbackDone
	StopCallbackServer()

	if callbackError != nil {
		return callbackError
	}

	return nil
}
