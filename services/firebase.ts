import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged as fbOnAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, signInAnonymously, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, ref as storageRefFromUrl } from 'firebase/storage';
import type { Trip } from '../types';

// Firebase-Konfiguration
// Diese Werte müssen aus der Firebase Console kopiert werden
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
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
let storage: any = null;
let auth: any = null;

// Firebase initialisieren (nur wenn konfiguriert)
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log('✅ Firebase erfolgreich initialisiert');
  } catch (error) {
    console.error('❌ Firebase-Initialisierung fehlgeschlagen:', error);
  }
} else {
  console.warn('⚠️ Firebase-Konfiguration unvollständig. App läuft im Demo-Modus.');
}

// Firestore-Sammlungen
const TRIPS_COLLECTION = 'trips';

// Auth-Service
export const authService = {
  onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return fbOnAuthStateChanged(auth, callback);
  },
  async signIn(email: string, password: string) {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, password);
  },
  async signOut() {
    if (!auth) return;
    await fbSignOut(auth);
  },
  async ensureSignedIn() {
    if (!auth) return;
    // Keine Auth-Requirements - lass es ohne Anmeldung laufen
    // Das funktioniert, wenn die Storage-Regeln offen sind
    console.log('Auth-Status: Keine Auth-Requirements');
  }
};

// Storage-Service Funktionen
export const storageService = {
  // Bild in Firebase Storage hochladen
  async uploadImage(imageDataUrl: string, fileName: string): Promise<string> {
    if (!storage) {
      throw new Error('Firebase Storage nicht verfügbar');
    }

    try {
      // Base64 zu Blob konvertieren
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Eindeutigen Dateinamen generieren
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const storageRef = ref(storage, `images/${uniqueFileName}`);
      
      // Bild hochladen
      await uploadBytes(storageRef, blob);
      
      // Download-URL abrufen
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Bild erfolgreich hochgeladen:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      throw error;
    }
  },

  // Generische Datei (Data-URL) hochladen
  async uploadDataUrl(dataUrl: string, fileName: string, folder: string = 'attachments'): Promise<string> {
    if (!storage) {
      throw new Error('Firebase Storage nicht verfügbar');
    }
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  },

  // Rohtext/HTML als Datei hochladen
  async uploadText(content: string, fileName: string, folder: string = 'contents', mimeType: string = 'text/html; charset=utf-8'): Promise<string> {
    if (!storage) {
      throw new Error('Firebase Storage nicht verfügbar');
    }
    const blob = new Blob([content], { type: mimeType });
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  },

  // Bild aus Firebase Storage löschen
  async deleteImage(imageUrl: string): Promise<void> {
    if (!storage) {
      console.warn('Firebase Storage nicht verfügbar - Bild-Löschung übersprungen');
      return;
    }

    try {
      const imageRef = storageRefFromUrl(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('✅ Bild erfolgreich gelöscht:', imageUrl);
    } catch (error) {
      console.error('Fehler beim Löschen des Bildes:', error);
    }
  }
};

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
        const data = tripDoc.data() as Trip;
        // Falls nur Pointer gespeichert ist, lade den vollen Trip
        if ((data as any).payloadUrl && (!data.days || data.days.length === 0)) {
          try {
            const res = await fetch((data as any).payloadUrl as unknown as string);
            if (res.ok) {
              const fullTrip = await res.json();
              return fullTrip as Trip;
            }
          } catch {}
        }
        return data;
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
        async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Trip;
            if ((data as any).payloadUrl && (!data.days || data.days.length === 0)) {
              try {
                const res = await fetch((data as any).payloadUrl as unknown as string);
                if (res.ok) {
                  const fullTrip = await res.json();
                  callback(fullTrip as Trip);
                  return;
                }
              } catch (e) {
                console.error('Fehler beim Laden des Trip-Payloads:', e);
              }
            }
            callback(data);
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