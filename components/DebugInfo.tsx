import React, { useState, useEffect } from 'react';

export default function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState({
    loading: true,
    error: null,
    trip: null,
    firebaseConnected: false,
    envVars: {}
  });

  useEffect(() => {
    // Environment-Variablen prüfen
    const envVars = {
      'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
      'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
      'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    };

    setDebugInfo(prev => ({
      ...prev,
      envVars,
      firebaseConnected: !!(envVars.VITE_FIREBASE_API_KEY && envVars.VITE_FIREBASE_PROJECT_ID)
    }));
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50 text-xs">
      <h3 className="font-semibold text-slate-800 mb-2">Debug Info</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Firebase:</span>
          <span className={debugInfo.firebaseConnected ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.firebaseConnected ? '✅' : '❌'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Loading:</span>
          <span className={debugInfo.loading ? 'text-yellow-600' : 'text-green-600'}>
            {debugInfo.loading ? '⏳' : '✅'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Trip:</span>
          <span className={debugInfo.trip ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.trip ? '✅' : '❌'}
          </span>
        </div>

        {debugInfo.error && (
          <div className="text-red-600 bg-red-50 p-1 rounded text-xs">
            Error: {debugInfo.error}
          </div>
        )}

        <div className="text-xs text-slate-500 mt-2">
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
} 