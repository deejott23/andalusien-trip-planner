import { useState, useCallback, useEffect } from 'react';
import type { Trip, Day, Entry, InfoEntry, NoteEntry, Attachment, DaySeparatorEntry, SeparatorEntry } from '../types';
import { EntryTypeEnum, CategoryEnum } from '../types';
import { tripService, storageService } from '../services/firebase';
// Funktion zum Abrufen von URL-Metadaten über Netlify Function
const fetchUrlMetadata = async (url: string) => {
  try {
    const response = await fetch(`/.netlify/functions/fetch-metadata?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return { title: url, description: '', imageUrl: null };
  }
};

const initialStations: Day[] = [
  {
    id: 'station-cadiz',
    title: 'Cádiz',
    duration: 4,
    color: 'orange',
    entries: [],
  },
  {
    id: 'station-marbella',
    title: 'Marbella',
    duration: 4,
    color: 'blue',
    entries: [],
  },
  {
    id: 'station-torrox',
    title: 'Torrox',
    duration: 7,
    color: 'green',
    entries: [],
  },
];


const initialTripData: Trip = {
  id: 'andalusien-2025',
  title: 'Andalusien 2025',
  dateRange: '27. August - 11. September',
  startDate: '2025-08-27',
  endDate: '2025-09-11',
  days: initialStations,
};


export const useTripData = (tripId: string = 'andalusien-2025') => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase Echtzeit-Updates abonnieren
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Sofort Demo-Daten laden als Fallback
    const loadDemoData = () => {
      console.log('📋 Lade Demo-Daten...');
      setTrip(initialTripData);
      setLoading(false);
    };

    // Timeout für den Fall, dass Firebase nicht antwortet
    const timeoutId = setTimeout(() => {
      console.log('⚠️ Firebase-Timeout - Verwende Demo-Daten');
      loadDemoData();
    }, 2000); // 2 Sekunden Timeout

    const unsubscribe = tripService.subscribeToTrip(tripId, (firebaseTrip) => {
      clearTimeout(timeoutId);
      if (firebaseTrip) {
        console.log('✅ Firebase-Daten geladen');
        setTrip(firebaseTrip);
      } else {
        console.log('📋 Keine Firebase-Daten - Verwende Demo-Daten');
        loadDemoData();
        // Speichere Demo-Daten in Firebase (nur wenn Firebase verfügbar)
        if (tripService.isConnected()) {
          const cleanedInitialData = cleanTripData(initialTripData);
          tripService.saveTrip(cleanedInitialData).catch(console.error);
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [tripId]);

  // Funktion zum Bereinigen von undefined-Werten
  const cleanTripData = (tripData: Trip): Trip => {
    const cleanObject = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(cleanObject).filter(item => item !== null);
      }
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    };
    
    return cleanObject(tripData) as Trip;
  };

  // Automatisches Speichern bei Änderungen
  useEffect(() => {
    if (trip && !loading) {
      const saveTimeout = setTimeout(() => {
        const cleanedTrip = cleanTripData(trip);
        tripService.saveTrip(cleanedTrip).catch((err) => {
          console.error('Fehler beim automatischen Speichern:', err);
          setError('Fehler beim Speichern der Änderungen');
        });
      }, 1000); // 1 Sekunde Verzögerung

      return () => clearTimeout(saveTimeout);
    }
  }, [trip, loading]);

  const addDay = useCallback((title: string) => {
    if (!trip) return;
    
    const newDay: Day = {
      id: `day-${Date.now()}`,
      title,
      entries: [],
      duration: 1,
      color: 'gray'
    };
    
    setTrip((prevTrip) => {
      if (!prevTrip) return prevTrip;
      return {
        ...prevTrip,
        days: [...prevTrip.days, newDay],
      };
    });
  }, [trip]);

  const updateDay = useCallback((dayId: string, updates: Partial<Day>) => {
    if (!trip) return;
    
    setTrip((prevTrip) => {
      if (!prevTrip) return prevTrip;
      return {
        ...prevTrip,
        days: prevTrip.days.map((day) =>
          day.id === dayId ? { ...day, ...updates } : day
        ),
      };
    });
  }, [trip]);
  
  const deleteDay = useCallback((dayId: string) => {
    if (!trip) return;
    
    setTrip((prevTrip) => {
      if (!prevTrip) return prevTrip;
      return {
        ...prevTrip,
        days: prevTrip.days.filter((day) => day.id !== dayId),
      };
    });
  }, [trip]);

  const addEntry = useCallback(async (dayId: string, type: EntryTypeEnum, data: { url?: string; content?: string; imageDataUrl?: string; attachment?: Attachment; title?: string; description?: string; date?: string; category?: CategoryEnum; style?: 'line' | 'section' | 'divider'; }) => {
    if (!trip) return;
    
    const tempId = `temp-${Date.now()}`;
    let newEntry: Entry;

    if (type === EntryTypeEnum.DAY_SEPARATOR && data.title && data.date) {
      newEntry = {
        id: tempId,
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: data.title,
        date: data.date,
      } as DaySeparatorEntry;
      
      setTrip(prevTrip => {
        if (!prevTrip) return prevTrip;
        
        // Spezielle Behandlung für "Vor dem Urlaub" Station
        if (dayId === 'before-trip') {
          // Prüfe, ob die Station bereits existiert
          const beforeTripExists = prevTrip.days.some(day => day.id === 'before-trip');
          
          if (!beforeTripExists) {
            // Erstelle die Station und füge den Eintrag hinzu
            const beforeTripDay = {
              id: 'before-trip',
              title: 'Vor dem Urlaub',
              duration: 0,
              color: 'gray',
              entries: [newEntry]
            };
            
            return {
              ...prevTrip,
              days: [beforeTripDay, ...prevTrip.days]
            };
          }
        }
        
        return {
          ...prevTrip,
          days: prevTrip.days.map(day => 
            day.id === dayId ? { ...day, entries: [...day.entries, newEntry] } : day
          )
        };
      });
    } else if (type === EntryTypeEnum.SEPARATOR) {
      newEntry = {
        id: tempId,
        type: EntryTypeEnum.SEPARATOR,
        title: data.title,
        style: data.style || 'line',
      } as SeparatorEntry;
      
      setTrip(prevTrip => {
        if (!prevTrip) return prevTrip;
        
        // Spezielle Behandlung für "Vor dem Urlaub" Station
        if (dayId === 'before-trip') {
          // Prüfe, ob die Station bereits existiert
          const beforeTripExists = prevTrip.days.some(day => day.id === 'before-trip');
          
          if (!beforeTripExists) {
            // Erstelle die Station und füge den Eintrag hinzu
            const beforeTripDay = {
              id: 'before-trip',
              title: 'Vor dem Urlaub',
              duration: 0,
              color: 'gray',
              entries: [newEntry]
            };
            
            return {
              ...prevTrip,
              days: [beforeTripDay, ...prevTrip.days]
            };
          }
        }
        
        return {
          ...prevTrip,
          days: prevTrip.days.map(day => 
            day.id === dayId ? { ...day, entries: [...day.entries, newEntry] } : day
          )
        };
      });
    } else if (type === EntryTypeEnum.NOTE && data.content) {
      // Bild über Firebase Storage hochladen, falls vorhanden
      let imageUrl = data.imageDataUrl;
      if (data.imageDataUrl) {
        try {
          imageUrl = await storageService.uploadImage(data.imageDataUrl, `image-${tempId}.jpg`);
        } catch (error) {
          console.error('Fehler beim Hochladen des Bildes:', error);
          // Fallback: Verwende Base64-URL (wird später durch Storage-URL ersetzt)
          imageUrl = data.imageDataUrl;
        }
      }

      newEntry = {
        id: tempId,
        type: EntryTypeEnum.NOTE,
        title: data.title,
        content: data.content,
        url: data.url,
        category: data.category || CategoryEnum.INFORMATION,
        attachment: data.attachment,
        imageUrl: imageUrl,
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      } as NoteEntry;
      
      setTrip(prevTrip => {
        if (!prevTrip) return prevTrip;
        
        // Spezielle Behandlung für "Vor dem Urlaub" Station
        if (dayId === 'before-trip') {
          // Prüfe, ob die Station bereits existiert
          const beforeTripExists = prevTrip.days.some(day => day.id === 'before-trip');
          
          if (!beforeTripExists) {
            // Erstelle die Station und füge den Eintrag hinzu
            const beforeTripDay = {
              id: 'before-trip',
              title: 'Vor dem Urlaub',
              duration: 0,
              color: 'gray',
              entries: [newEntry]
            };
            
            return {
              ...prevTrip,
              days: [beforeTripDay, ...prevTrip.days]
            };
          }
        }
        
        return {
          ...prevTrip,
          days: prevTrip.days.map(day => 
            day.id === dayId ? { ...day, entries: [...day.entries, newEntry] } : day
          )
        };
      });
    }
  }, [trip]);

  const updateEntry = useCallback((dayId: string, updatedEntry: Entry) => {
    if (!trip) return;
    
    setTrip((prevTrip) => {
      if (!prevTrip) return prevTrip;
      
      // Spezielle Behandlung für "Vor dem Urlaub" Station
      if (dayId === 'before-trip') {
        const beforeTripExists = prevTrip.days.some(day => day.id === 'before-trip');
        
        if (!beforeTripExists) {
          // Erstelle die Station falls sie nicht existiert
          const beforeTripDay = {
            id: 'before-trip',
            title: 'Vor dem Urlaub',
            duration: 0,
            color: 'gray',
            entries: [updatedEntry]
          };
          
          return {
            ...prevTrip,
            days: [beforeTripDay, ...prevTrip.days]
          };
        }
      }
      
      return {
        ...prevTrip,
        days: prevTrip.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                entries: day.entries.map((entry) =>
                  entry.id === updatedEntry.id ? updatedEntry : entry
                ),
              }
            : day
        ),
      };
    });
  }, [trip]);

  const deleteEntry = useCallback((dayId: string, entryId: string) => {
    if (!trip) return;
    
    setTrip((prevTrip) => {
      if (!prevTrip) return prevTrip;
      
      // Finde den Eintrag, um zu prüfen, ob er ein Bild hat
      let entryToDelete: Entry | undefined;
      for (const day of prevTrip.days) {
        entryToDelete = day.entries.find(entry => entry.id === entryId);
        if (entryToDelete) break;
      }
      
      // Lösche das Bild aus Firebase Storage, falls vorhanden
      if (entryToDelete && 'imageUrl' in entryToDelete && entryToDelete.imageUrl) {
        storageService.deleteImage(entryToDelete.imageUrl).catch(console.error);
      }
      
      // Spezielle Behandlung für "Vor dem Urlaub" Station
      if (dayId === 'before-trip') {
        const beforeTripExists = prevTrip.days.some(day => day.id === 'before-trip');
        
        if (!beforeTripExists) {
          // Station existiert nicht, nichts zu löschen
          return prevTrip;
        }
      }
      
      return {
        ...prevTrip,
        days: prevTrip.days.map((day) =>
          day.id === dayId
            ? { ...day, entries: day.entries.filter((e) => e.id !== entryId) }
            : day
        ),
      };
    });
  }, [trip]);
  
  const moveArrayItem = <T,>(array: T[], from: number, to: number): T[] => {
    const newArray = [...array];
    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);
    return newArray;
  };

  const moveDay = useCallback((fromIndex: number, toIndex: number) => {
    if (!trip) return;
    
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip;
      return {
        ...prevTrip,
        days: moveArrayItem(prevTrip.days, fromIndex, toIndex),
      };
    });
  }, [trip]);

  const moveEntry = useCallback((dayId: string, fromIndex: number, toIndex: number) => {
    if (!trip) return;
    
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip;
      const dayIndex = prevTrip.days.findIndex(d => d.id === dayId);
      if (dayIndex === -1) return prevTrip;

      const updatedDays = [...prevTrip.days];
      const dayToUpdate = updatedDays[dayIndex];
      
      const reorderedEntries = moveArrayItem(dayToUpdate.entries, fromIndex, toIndex);
      
      updatedDays[dayIndex] = { ...dayToUpdate, entries: reorderedEntries };

      return { ...prevTrip, days: updatedDays };
    });
  }, [trip]);

  const updateEntryReaction = useCallback((dayId: string, entryId: string, newReaction: 'like' | 'dislike') => {
    if (!trip) return;
    
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip;
      return {
        ...prevTrip,
        days: prevTrip.days.map(day => {
          if (day.id === dayId) {
            return {
              ...day,
              entries: day.entries.map(entry => {
                if (entry.id === entryId && (entry.type === EntryTypeEnum.INFO || entry.type === EntryTypeEnum.NOTE)) {
                  const currentReactions = entry.reactions || { likes: 0, dislikes: 0, userReaction: null };
                  let { likes, dislikes, userReaction } = currentReactions;
                  const oldReaction = userReaction;
                  
                  // If clicking the same reaction, toggle it off
                  if (oldReaction === newReaction) {
                    userReaction = null;
                    if (newReaction === 'like') likes--;
                    else dislikes--;
                  } else {
                    // If there was a previous reaction, undo it
                    if (oldReaction === 'like') likes--;
                    if (oldReaction === 'dislike') dislikes--;
                    
                    // Apply the new reaction
                    userReaction = newReaction;
                    if (newReaction === 'like') likes++;
                    else dislikes++;
                  }

                  return { ...entry, reactions: { likes, dislikes, userReaction } };
                }
                return entry;
              })
            };
          }
          return day;
        })
      };
    });
  }, [trip]);

  // Funktion zum Bereinigen der Datenbank und Wiederherstellen der Einträge
  const resetDatabase = useCallback(async () => {
    try {
      console.log('🔄 Starte Datenbank-Reset...');
      
      // Lösche das aktuelle Trip-Dokument
      await tripService.deleteTrip(tripId);
      console.log('✅ Altes Trip-Dokument gelöscht');
      
      // Lade Demo-Daten neu
      setTrip(initialTripData);
      setLoading(false);
      setError(null);
      
      console.log('✅ Datenbank-Reset abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler beim Datenbank-Reset:', error);
      setError('Fehler beim Zurücksetzen der Datenbank');
    }
  }, [tripId]);

  return { 
    trip, 
    loading, 
    error,
    addDay, 
    updateDay, 
    deleteDay, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    moveDay, 
    moveEntry, 
    updateEntryReaction,
    resetDatabase,
  };
};