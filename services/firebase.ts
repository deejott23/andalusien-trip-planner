import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Trip } from '../types';

// Firebase-Konfiguration
// Diese Werte müssen aus der Firebase Console kopiert werden
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Prüfe ob alle erforderlichen Firebase-Konfigurationswerte vorhanden sind
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId && 
         firebaseConfig.storageBucket && 
         firebaseConfig.messagingSenderId && 
         firebaseConfig.appId;
};

let app: any = null;
let db: any = null;

// Firebase initialisieren (nur wenn konfiguriert)
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase erfolgreich initialisiert');
  } catch (error) {
    console.error('❌ Firebase-Initialisierung fehlgeschlagen:', error);
  }
} else {
  console.warn('⚠️ Firebase-Konfiguration unvollständig. App läuft im Demo-Modus.');
}

// Firestore-Sammlungen
const TRIPS_COLLECTION = 'trips';

// Trip-Service Funktionen
export const tripService = {
  // Trip laden
  async getTrip(tripId: string): Promise<Trip | null> {
    if (!db) {
      console.warn('Firebase nicht verfügbar - Demo-Modus');
      return null;
    }

    try {
      // Timeout für Firebase-Operationen
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase-Timeout')), 3000);
      });

      const tripDoc = await Promise.race([
        getDoc(doc(db, TRIPS_COLLECTION, tripId)),
        timeoutPromise
      ]);

      if (tripDoc.exists()) {
        return tripDoc.data() as Trip;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Laden des Trips:', error);
      return null;
    }
  },

  // Trip speichern/aktualisieren
  async saveTrip(trip: Trip): Promise<void> {
    if (!db) {
      console.warn('Firebase nicht verfügbar - Speichern übersprungen');
      return;
    }

    try {
      await setDoc(doc(db, TRIPS_COLLECTION, trip.id), trip);
      console.log('✅ Trip erfolgreich gespeichert:', trip.id);
    } catch (error) {
      console.error('Fehler beim Speichern des Trips:', error);
      throw error;
    }
  },

  // Trip löschen
  async deleteTrip(tripId: string): Promise<void> {
    if (!db) {
      console.warn('Firebase nicht verfügbar - Löschen übersprungen');
      return;
    }

    try {
      await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
      console.log('✅ Trip erfolgreich gelöscht:', tripId);
    } catch (error) {
      console.error('Fehler beim Löschen des Trips:', error);
      throw error;
    }
  },

  // Echtzeit-Updates abonnieren
  subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void) {
    if (!db) {
      console.warn('Firebase nicht verfügbar - Echtzeit-Updates deaktiviert');
      // Fallback: Sofort null zurückgeben
      setTimeout(() => callback(null), 50);
      return () => {}; // Leere unsubscribe-Funktion
    }

    try {
      return onSnapshot(
        doc(db, TRIPS_COLLECTION, tripId),
        (doc) => {
          if (doc.exists()) {
            callback(doc.data() as Trip);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Fehler beim Abonnieren des Trips:', error);
          callback(null);
        }
      );
    } catch (error) {
      console.error('Fehler beim Einrichten der Echtzeit-Updates:', error);
      callback(null);
      return () => {};
    }
  },

  // Firebase-Verbindungsstatus prüfen
  isConnected(): boolean {
    return db !== null;
  }
};

export { db }; 