# Andalusien Trip Planner

Eine moderne Reiseplanungs-App für die Andalusien-Reise 2025 mit Firebase-Persistierung und Echtzeit-Updates.

## Features

- 🗺️ **Timeline-Navigation** - Horizontale Stationen-Übersicht
- 📝 **Rich-Text-Notizen** - Mit Anhängen und Formatierung
- 🔗 **Link-Metadaten** - Automatische Vorschau von URLs
- 🎯 **Tagesmarkierungen** - Chronologische Organisation
- 👍 **Reaktionssystem** - Like/Dislike für Einträge
- 🔄 **Echtzeit-Updates** - Firebase Firestore Integration
- 📱 **Responsive Design** - Optimiert für alle Geräte
- 🎨 **Moderne UI** - Tailwind CSS mit warmen Andalusien-Farben

## Technologie-Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase Firestore
- **APIs:** Google Gemini für URL-Metadaten
- **State Management:** React Hooks mit Firebase Realtime

## Setup & Installation

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Firebase-Projekt einrichten

1. **Firebase Console:** Gehe zu [console.firebase.google.com](https://console.firebase.google.com/)
2. **Neues Projekt erstellen:**
   - Name: `andalusien-trip-planner`
   - Google Analytics: Optional
3. **Firestore Database aktivieren:**
   - Firestore Database → Datenbank erstellen
   - Testmodus starten
   - Standort: `europe-west3` (Frankfurt)
4. **Web-App hinzufügen:**
   - Projekt-Dashboard → Web-App hinzufügen (</>)
   - App-Nickname: `andalusien-web`
   - App registrieren

### 3. Environment-Variablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Gemini API (optional für URL-Metadaten)
GEMINI_API_KEY=your-gemini-api-key-here
```

**Firebase-Konfiguration kopieren:**
- In der Firebase Console: Projekt-Einstellungen → Allgemein
- Unter "Deine Apps" → Web-App → Konfiguration
- Die Werte in die `.env` Datei eintragen

### 4. App starten

```bash
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

## App-Struktur

```
andalusien/
├── components/          # React-Komponenten
│   ├── Timeline.tsx    # Horizontale Navigation
│   ├── Day.tsx         # Station/Tag-Komponente
│   ├── EntryCard.tsx   # Eintrag-Karten
│   └── ...            # Modals und UI-Komponenten
├── hooks/
│   └── useTripData.ts  # Firebase-Integration & State
├── services/
│   ├── firebase.ts     # Firebase-Konfiguration
│   └── geminiService.ts # URL-Metadaten API
├── types.ts            # TypeScript-Definitionen
└── App.tsx            # Hauptkomponente
```

## Firebase-Integration

### Datenmodell

```typescript
Trip {
  id: string
  title: string
  dateRange: string
  startDate: string
  endDate: string
  days: Day[]
}

Day {
  id: string
  title: string
  duration: number
  color: string
  entries: Entry[]
}

Entry {
  - LinkEntry (URLs mit Metadaten)
  - NoteEntry (Notizen mit Anhängen)
  - DaySeparatorEntry (Tagesmarkierungen)
}
```

### Features

- **Echtzeit-Updates:** Automatische Synchronisation zwischen Clients
- **Automatisches Speichern:** Änderungen werden nach 1 Sekunde gespeichert
- **Offline-Fallback:** Demo-Daten werden geladen, wenn Firebase nicht verfügbar
- **Error Handling:** Benutzerfreundliche Fehlermeldungen

## Entwicklung

### Verfügbare Scripts

```bash
npm run dev      # Entwicklungsserver starten
npm run build    # Produktions-Build erstellen
npm run preview  # Build lokal testen
```

### Debugging

- **Firebase Console:** Echtzeit-Daten in der Firestore Database anzeigen
- **Browser DevTools:** Network-Tab für API-Calls überwachen
- **Console:** Firebase-Verbindungsstatus und Fehler

## Deployment

### Firebase Hosting (Empfohlen)

1. **Firebase CLI installieren:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase initialisieren:**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build und Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

### Alternative: Vercel/Netlify

- Build-Verzeichnis: `dist/`
- Environment-Variablen in der Hosting-Plattform konfigurieren

## Nächste Schritte

- [ ] **Authentifizierung:** User-Management mit Firebase Auth
- [ ] **Offline-Support:** Service Worker für Offline-Funktionalität
- [ ] **Karten-Integration:** Google Maps für Standorte
- [ ] **Wetter-API:** Aktuelle Wetterdaten für Reiseziele
- [ ] **Export-Funktionen:** PDF/CSV Export der Reisepläne
- [ ] **Kollaboration:** Mehrere Benutzer können gemeinsam planen

## Support

Bei Fragen oder Problemen:
1. Firebase Console für Datenbank-Status prüfen
2. Browser Console für JavaScript-Fehler
3. Network-Tab für API-Verbindungen
4. Environment-Variablen auf Korrektheit prüfen
