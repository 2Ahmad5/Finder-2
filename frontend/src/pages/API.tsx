import React, { useState, useEffect } from 'react';
import Navbar from '../navbar/Navbar';
import { StartGoogleLogin, IsGoogleConnected, GetGoogleEmail, DisconnectGoogle, ListGoogleDocs } from '../../wailsjs/go/main/App';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

const API: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [googleDocs, setGoogleDocs] = useState<any[]>([]);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await IsGoogleConnected();
      setIsConnected(connected);
      if (connected) {
        const userEmail = await GetGoogleEmail();
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const authUrl = await StartGoogleLogin();
      if (authUrl) {
        // Open Google login in browser using Wails runtime
        BrowserOpenURL(authUrl);

        let attempts = 0;
        const maxAttempts = 60; // 2 minutes with 2 second intervals

        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const connected = await IsGoogleConnected();
            if (connected) {
              clearInterval(pollInterval);
              await checkConnection();
              setIsLoading(false);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
        }, 2000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await DisconnectGoogle();
      setIsConnected(false);
      setEmail('');
    } catch (error) {
      console.error('Error disconnecting from Google:', error);
    }
  };

  const handleEdit = async () => {
    console.log('Edit button clicked!');
    try {
      console.log('Fetching Google Docs...');
      const docs = await ListGoogleDocs();
      console.log('Got docs:', docs);
      setGoogleDocs(docs);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching Google Docs:', error);
      alert('Error: ' + error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Navbar */}
      <Navbar pageName="Connections" />

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {/* Google Docs Integration Box */}
          <div className="relative border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow max-w-xs">
            {/* Google Docs Icon and Title */}
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#2196F3" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                <path fill="#BBDEFB" d="M40 13L30 13 30 3z"/>
                <path fill="#1565C0" d="M30 13L40 23 40 13z"/>
                <path fill="#E3F2FD" d="M15 23H33V25H15zM15 27H33V29H15zM15 31H33V33H15zM15 35H25V37H15z"/>
              </svg>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Google Docs</h3>
                <p className="text-xs text-gray-500">Connect your account</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-5">
              Access and manage your Google Docs directly from your file manager.
            </p>

            {/* Connection Status */}
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">Connected as <span className="font-medium">{email}</span></span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
                {isLoading && (
                  <button
                    onClick={checkConnection}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Check Status
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Google Docs</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {googleDocs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Google Docs found</p>
              ) : (
                <div className="space-y-2">
                  {googleDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Icon based on type */}
                          {doc.mimeType === 'application/vnd.google-apps.document' && (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#4285F4">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                              <path fill="#fff" d="M8 13h8v1H8zm0-2h8v1H8zm0-2h5v1H8z"/>
                            </svg>
                          )}
                          {doc.mimeType === 'application/vnd.google-apps.spreadsheet' && (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0F9D58">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                            </svg>
                          )}
                          {doc.mimeType === 'application/vnd.google-apps.presentation' && (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#F4B400">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                            </svg>
                          )}
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.mimeType.includes('document') && 'Document'}
                              {doc.mimeType.includes('spreadsheet') && 'Spreadsheet'}
                              {doc.mimeType.includes('presentation') && 'Presentation'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => BrowserOpenURL(doc.webLink)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default API;
