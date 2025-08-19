
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';

// Einfache Passwortsperre (Client-seitig)
const PASS_KEY = 'APP_UNLOCKED';
const EXPECTED = (import.meta as any).env?.VITE_APP_PASSWORD || '';

function ensurePasswordGate(): Promise<void> {
  if (!EXPECTED) return Promise.resolve();
  if (sessionStorage.getItem(PASS_KEY) === '1') return Promise.resolve();
  return new Promise((resolve) => {
    // Einfacher Prompt. Optional: schicker Dialog bauen.
    const entered = window.prompt('Passwort eingeben');
    if (entered === EXPECTED) {
      sessionStorage.setItem(PASS_KEY, '1');
      resolve();
    } else {
      // Reload, um erneut zu versuchen
      window.location.reload();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

ensurePasswordGate().then(() => {
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
});
