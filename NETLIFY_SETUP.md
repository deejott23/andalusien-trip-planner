# Netlify Setup Anleitung

## Umgebungsvariablen in Netlify konfigurieren

1. Gehe zu deinem Netlify Dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Site settings** → **Environment variables**
4. Füge folgende Umgebungsvariablen hinzu:

### Firebase-Konfiguration
```
VITE_FIREBASE_API_KEY=AIzaSyCBzVRD5-cv8JqGzukZvUykftz8vh6u8Z8
VITE_FIREBASE_AUTH_DOMAIN=andalusien-trip-planner.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=andalusien-trip-planner
VITE_FIREBASE_STORAGE_BUCKET=andalusien-trip-planner.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=303686955509
VITE_FIREBASE_APP_ID=1:303686955509:web:0853174f32de9e686870bc
```

### Optional: Gemini API (falls benötigt)
```
GEMINI_API_KEY=your-gemini-api-key-here
```

## Nach dem Hinzufügen der Umgebungsvariablen

1. Gehe zu **Deploys** in deinem Netlify Dashboard
2. Klicke auf **Trigger deploy** → **Deploy site**
3. Warte bis der Build abgeschlossen ist
4. Teste deine App

## Troubleshooting

Falls die App immer noch nicht lädt:
1. Prüfe die Build-Logs in Netlify
2. Stelle sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
3. Prüfe die Browser-Konsole auf weitere Fehler 