import React, { useState, useEffect } from 'react';
import { tripService } from '../services/firebase';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'timeout'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Environment-Variablen prüfen
    const vars = {
      'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
      'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
      'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    };
    setEnvVars(vars);

    // Timeout für den Test
    const timeoutId = setTimeout(() => {
      setStatus('timeout');
      setErrorMessage('Test-Timeout - Firebase nicht verfügbar');
    }, 5000); // 5 Sekunden Timeout

    // Firebase-Verbindung testen
    const testConnection = async () => {
      try {
        // Prüfe zuerst ob Firebase konfiguriert ist
        if (!tripService.isConnected()) {
          clearTimeout(timeoutId);
          setStatus('error');
          setErrorMessage('Firebase nicht konfiguriert - Demo-Modus aktiv');
          return;
        }

        // Versuche einen Test-Trip zu laden (sollte null zurückgeben)
        const testTrip = await tripService.getTrip('test-connection');
        clearTimeout(timeoutId);
        setStatus('connected');
        console.log('✅ Firebase-Verbindung erfolgreich');
      } catch (error) {
        clearTimeout(timeoutId);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unbekannter Fehler');
        console.error('❌ Firebase-Verbindung fehlgeschlagen:', error);
      }
    };

    testConnection();

    // Cleanup
    return () => clearTimeout(timeoutId);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'timeout': return 'text-orange-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      case 'timeout': return '⏰';
      default: return '⏳';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading': return 'Verbindung wird getestet...';
      case 'connected': return 'Verbunden';
      case 'error': return 'Fehler';
      case 'timeout': return 'Timeout';
      default: return 'Unbekannt';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-semibold text-slate-800 mb-2">Firebase Status</h3>
      
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {(status === 'error' || status === 'timeout') && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {errorMessage}
          </div>
        )}

        <div className="text-xs text-slate-600 space-y-1">
          <div className="font-medium">Environment-Variablen:</div>
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-mono text-xs">{key}:</span>
              <span className={`font-mono text-xs ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-500 mt-2">
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline"
          >
            Status neu laden
          </button>
        </div>
      </div>
    </div>
  );
} 