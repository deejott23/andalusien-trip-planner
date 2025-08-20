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

  // Hilfsfunktionen: Hashtags normalisieren (# prefix sicherstellen)
  const normalizeHashtags = useCallback((hashtags?: string[]) => {
    if (!hashtags || !Array.isArray(hashtags)) return hashtags;
    return hashtags
      .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
      .map((tag) => {
        const trimmed = tag.trim();
        const withoutHashes = trimmed.replace(/^#+/, '');
        return `#${withoutHashes}`;
      });
  }, []);

  const normalizeTripData = useCallback((incoming: Trip | null): Trip | null => {
    if (!incoming) return incoming;
    return {
      ...incoming,
      days: incoming.days.map((day) => ({
        ...day,
        entries: day.entries.map((entry) => {
          if ((entry as any).hashtags) {
            return { ...(entry as any), hashtags: normalizeHashtags((entry as any).hashtags) } as Entry;
          }
          return entry;
        }),
      })),
    };
  }, [normalizeHashtags]);

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
        setTrip(normalizeTripData(firebaseTrip));
      } else {
        console.log('📋 Keine Firebase-Daten - Prüfe lokales Backup...');
        
        // Prüfe lokales Backup
        try {
          const backupData = localStorage.getItem('andalusien-trip-backup');
          const backupTimestamp = localStorage.getItem('andalusien-trip-backup-timestamp');
          
          if (backupData && backupTimestamp) {
            const backupAge = Date.now() - parseInt(backupTimestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 Tage
            
            if (backupAge < maxAge) {
              console.log('✅ Lokales Backup gefunden und geladen');
              const restoredTrip = JSON.parse(backupData);
              setTrip(normalizeTripData(restoredTrip));
              setLoading(false);
              return;
            } else {
              console.log('⚠️ Lokales Backup zu alt, verwende Demo-Daten');
              localStorage.removeItem('andalusien-trip-backup');
              localStorage.removeItem('andalusien-trip-backup-timestamp');
            }
          }
        } catch (error) {
          console.warn('⚠️ Fehler beim Laden des lokalen Backups:', error);
        }
        
        console.log('📋 Verwende Demo-Daten (nur lokal, keine automatische Speicherung in Firebase)');
        loadDemoData();
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
        (async () => {
          const cleanedTrip = cleanTripData(trip);

          // Falls Data-URLs vorhanden sind, führe zuerst eine Migration in den Storage durch
          const migratedTrip = await (async () => {
            let hasChanges = false;

            const migrateEntry = async (entry: Entry): Promise<Entry> => {
              const replaceDataUrlsInHtml = async (html: string, entryId: string): Promise<string> => {
                if (!html || html.indexOf('data:') === -1) return html;
                // Finde data:-Bilder in img/src
                const srcRegex = /src=\"(data:[^\"]+)\"/g;
                const replacements: Array<Promise<string>> = [];
                const dataUrls: string[] = [];
                let match: RegExpExecArray | null;
                while ((match = srcRegex.exec(html)) !== null) {
                  dataUrls.push(match[1]);
                }
                if (dataUrls.length === 0) return html;
                for (let i = 0; i < dataUrls.length; i++) {
                  const dataUrl = dataUrls[i];
                  try {
                    const uploadedUrl = await storageService.uploadDataUrl(dataUrl, `content-image-${entryId}-${i}.png`, 'images');
                    replacements.push(Promise.resolve(uploadedUrl));
                  } catch (e) {
                    console.error('Migration: Content-Bild-Upload fehlgeschlagen', e);
                    replacements.push(Promise.resolve(dataUrl));
                  }
                }
                const uploaded = await Promise.all(replacements);
                // Ersetze sequentiell
                let replaced = html;
                for (let i = 0; i < dataUrls.length; i++) {
                  const original = dataUrls[i].replace(/[-/\\^$*+?.()|[\]{}]/g, r => r);
                  replaced = replaced.replace(`src=\"${dataUrls[i]}\"`, `src=\"${uploaded[i]}\"`);
                }
                if (replaced !== html) hasChanges = true;
                return replaced;
              };
              if (entry.type === EntryTypeEnum.INFO) {
                const info = entry as InfoEntry;
                let next: InfoEntry = info;

                if (info.imageUrl && /^data:/i.test(info.imageUrl)) {
                  try {
                    const url = await storageService.uploadImage(info.imageUrl, `image-${info.id}.jpg`);
                    next = { ...next, imageUrl: url };
                    hasChanges = true;
                  } catch (e) {
                    console.error('Migration: Bild-Upload (INFO) fehlgeschlagen', e);
                  }
                }

                if (info.attachment?.url && /^data:/i.test(info.attachment.url)) {
                  try {
                    const uploaded = await storageService.uploadDataUrl(info.attachment.url, info.attachment.name || `attachment-${info.id}`);
                    next = { ...next, attachment: { ...info.attachment, url: uploaded } };
                    hasChanges = true;
                  } catch (e) {
                    console.error('Migration: Attachment-Upload (INFO) fehlgeschlagen', e);
                  }
                }

                // Content-Migration (eingebettete data:-Bilder)
                if (typeof next.content === 'string' && next.content.includes('data:')) {
                  const migratedContent = await replaceDataUrlsInHtml(next.content, info.id);
                  if (migratedContent !== next.content) {
                    next = { ...next, content: migratedContent };
                  }
                }

                return next;
              }

              if (entry.type === EntryTypeEnum.NOTE) {
                const note = entry as NoteEntry;
                let next: NoteEntry = note;

                if (note.imageUrl && /^data:/i.test(note.imageUrl)) {
                  try {
                    const url = await storageService.uploadImage(note.imageUrl, `image-${note.id}.jpg`);
                    next = { ...next, imageUrl: url };
                    hasChanges = true;
                  } catch (e) {
                    console.error('Migration: Bild-Upload (NOTE) fehlgeschlagen', e);
                  }
                }

                if (note.attachment?.url && /^data:/i.test(note.attachment.url)) {
                  try {
                    const uploaded = await storageService.uploadDataUrl(note.attachment.url, note.attachment.name || `attachment-${note.id}`);
                    next = { ...next, attachment: { ...note.attachment, url: uploaded } };
                    hasChanges = true;
                  } catch (e) {
                    console.error('Migration: Attachment-Upload (NOTE) fehlgeschlagen', e);
                  }
                }

                // Content-Migration (eingebettete data:-Bilder)
                if (typeof next.content === 'string' && next.content.includes('data:')) {
                  const migratedContent = await replaceDataUrlsInHtml(next.content, note.id);
                  if (migratedContent !== next.content) {
                    next = { ...next, content: migratedContent };
                  }
                }

                return next;
              }

              return entry;
            };

            // Prüfe schnell, ob Data-URLs existieren
            const maybeHasDataUrls = JSON.stringify(cleanedTrip).includes('data:');
            if (!maybeHasDataUrls) return null;

            const migratedDays = [] as Day[];
            for (const day of cleanedTrip.days) {
              let dayChanged = false;
              const newEntries: Entry[] = [];
              for (const entry of day.entries) {
                const migratedEntry = await migrateEntry(entry);
                if (migratedEntry !== entry) dayChanged = true;
                newEntries.push(migratedEntry);
              }
              migratedDays.push(dayChanged ? { ...day, entries: newEntries } : day);
            }

            if (!hasChanges) return null;
            return { ...cleanedTrip, days: migratedDays } as Trip;
          })();

          if (migratedTrip) {
            // Lokales Backup nach Migration
            try {
              localStorage.setItem('andalusien-trip-backup', JSON.stringify(migratedTrip));
              localStorage.setItem('andalusien-trip-backup-timestamp', Date.now().toString());
            } catch {}

            // Setze migrierten Trip; Speichern passiert im nächsten Effekt-Lauf
            setTrip(migratedTrip);
            return;
          }

          // Lokales Backup erstellen
          try {
            localStorage.setItem('andalusien-trip-backup', JSON.stringify(cleanedTrip));
            localStorage.setItem('andalusien-trip-backup-timestamp', Date.now().toString());
            console.log('✅ Lokales Backup erstellt');
          } catch (error) {
            console.warn('⚠️ Lokales Backup fehlgeschlagen:', error);
          }

          // Größenprüfung vor dem Speichern
          let tripToSave: Trip = cleanedTrip;
          const computeSize = (t: Trip) => JSON.stringify(t).length;
          const maxSize = 950 * 1024; // 950 KB Puffer (Firestore-Hardlimit ~1 MiB)
          let tripSize = computeSize(tripToSave);

          if (tripSize > maxSize) {
            console.warn(`⚠️ Trip zu groß (${Math.round(tripSize/1024)} KB) – versuche Inhalte iterativ auszulagern`);

            try {
              // Liste aller auslagerbaren Inhalte sammeln (größte zuerst)
              type Candidate = { dayIdx: number; entryIdx: number; length: number };
              const candidates: Candidate[] = [];
              tripToSave.days.forEach((day, dayIdx) => {
                day.entries.forEach((entry, entryIdx) => {
                  if ((entry.type === EntryTypeEnum.INFO || entry.type === EntryTypeEnum.NOTE)) {
                    const text = (entry as any).content as string;
                    const hasUrl = Boolean((entry as any).contentUrl);
                    if (text && text.length > 0 && !hasUrl) {
                      candidates.push({ dayIdx, entryIdx, length: text.length });
                    }
                  }
                });
              });
              candidates.sort((a,b) => b.length - a.length);

              // Iterativ auslagern, bis unter Limit oder keine Kandidaten mehr
              for (const c of candidates) {
                if (tripSize <= maxSize) break;
                const entry: any = (tripToSave.days[c.dayIdx].entries[c.entryIdx] as any);
                const text: string = entry.content;
                try {
                  const url = await storageService.uploadText(text, `content-${entry.id}.html`, 'contents', 'text/html; charset=utf-8');
                  entry.contentUrl = url;
                  entry.content = '';
                  // Größe nach jeder Auslagerung neu berechnen
                  tripSize = computeSize(tripToSave);
                } catch (e) {
                  console.error('Auslagerung content fehlgeschlagen', e);
                }
              }
            } catch (e) {
              console.error('Fehler bei der Inhaltsauslagerung', e);
            }

            if (tripSize > maxSize) {
              try {
                // Fallback: gesamten Trip als Datei auslagern und nur Pointer speichern
                const url = await storageService.uploadText(JSON.stringify(tripToSave), `trip-${tripToSave.id}.json`, 'trips', 'application/json');
                tripToSave = { id: tripToSave.id, title: tripToSave.title, dateRange: tripToSave.dateRange, startDate: tripToSave.startDate, endDate: tripToSave.endDate, days: [], payloadUrl: url } as unknown as Trip;
                tripSize = computeSize(tripToSave);
              } catch {}
              if (tripSize > maxSize) {
                try {
                  localStorage.setItem('andalusien-trip-backup-large', JSON.stringify(tripToSave));
                  localStorage.setItem('andalusien-trip-backup-large-timestamp', Date.now().toString());
                } catch {}
                setError(`Daten zu groß (${Math.round(tripSize/1024)} KB). Backup erstellt. Bitte Bilder entfernen oder Daten aufteilen.`);
                return;
              }
            }
          }

          // Firebase speichern
          tripService.saveTrip(tripToSave).catch((err) => {
            console.error('Fehler beim automatischen Speichern:', err);
            setError('Fehler beim Speichern der Änderungen');
          });
        })();
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

  const addEntry = useCallback(async (dayId: string, type: EntryTypeEnum, data: { url?: string; content?: string; imageDataUrl?: string; attachment?: Attachment; title?: string; description?: string; date?: string; category?: CategoryEnum; style?: 'line' | 'section' | 'divider'; hashtags?: string[]; }) => {
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
      // Bild-Handling: Data-URLs in Storage hochladen, externe URLs direkt übernehmen
      let imageUrl = data.imageDataUrl;
      if (data.imageDataUrl) {
        const isExternal = /^https?:\/\//i.test(data.imageDataUrl);
        const isDataUrl = /^data:/i.test(data.imageDataUrl);
        if (isDataUrl) {
          try {
            imageUrl = await storageService.uploadImage(data.imageDataUrl, `image-${tempId}.jpg`);
          } catch (error) {
            console.error('Fehler beim Hochladen des Bildes:', error);
            imageUrl = undefined;
          }
        }
      }

      newEntry = {
        id: tempId,
        type: EntryTypeEnum.NOTE,
        title: data.title,
        content: data.content,
        url: data.url,
        category: data.category || CategoryEnum.INFORMATION,
        hashtags: data.hashtags,
        // Attachment: falls Base64/Data-URL -> in Storage hochladen, sonst URL übernehmen
        attachment: undefined,
        imageUrl: imageUrl,
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      } as NoteEntry;
      
      // Falls Attachment vorhanden, verarbeite es asynchron vor dem Setzen
      if (data.attachment?.url) {
        const isDataUrl = /^data:/i.test(data.attachment.url);
        const isExternal = /^https?:\/\//i.test(data.attachment.url);
        if (isDataUrl) {
          try {
            const uploadedUrl = await storageService.uploadDataUrl(data.attachment.url, data.attachment.name || `attachment-${tempId}`);
            newEntry = {
              ...(newEntry as any),
              attachment: { ...data.attachment, url: uploadedUrl },
            } as any;
          } catch (error) {
            console.error('Fehler beim Hochladen des Attachments:', error);
          }
        } else if (isExternal) {
          newEntry = {
            ...(newEntry as any),
            attachment: data.attachment,
          } as any;
        }
      }

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

  const updateEntry = useCallback(async (dayId: string, updatedEntry: Entry) => {
    if (!trip) return;

    let processedEntry = updatedEntry;

    try {
      // Falls Base64/Data-URLs vorhanden sind, vor dem Speichern in Storage hochladen
      if (updatedEntry.type === EntryTypeEnum.INFO) {
        const infoEntry = updatedEntry as InfoEntry;
        // Bild-Upload
        if (infoEntry.imageUrl && /^data:/i.test(infoEntry.imageUrl)) {
          try {
            const uploadedUrl = await storageService.uploadImage(infoEntry.imageUrl, `image-${infoEntry.id}.jpg`);
            processedEntry = { ...infoEntry, imageUrl: uploadedUrl } as Entry;
          } catch (e) {
            console.error('Fehler beim Bild-Upload (INFO):', e);
          }
        }
        // Attachment-Upload
        if (infoEntry.attachment?.url && /^data:/i.test(infoEntry.attachment.url)) {
          try {
            const uploadedAttachmentUrl = await storageService.uploadDataUrl(
              infoEntry.attachment.url,
              infoEntry.attachment.name || `attachment-${infoEntry.id}`
            );
            processedEntry = {
              ...(processedEntry as InfoEntry),
              attachment: { ...infoEntry.attachment, url: uploadedAttachmentUrl },
            } as Entry;
          } catch (e) {
            console.error('Fehler beim Attachment-Upload (INFO):', e);
          }
        }
      } else if (updatedEntry.type === EntryTypeEnum.NOTE) {
        const noteEntry = updatedEntry as NoteEntry;
        // Bild-Upload (falls vorhanden)
        if (noteEntry.imageUrl && /^data:/i.test(noteEntry.imageUrl)) {
          try {
            const uploadedUrl = await storageService.uploadImage(noteEntry.imageUrl, `image-${noteEntry.id}.jpg`);
            processedEntry = { ...noteEntry, imageUrl: uploadedUrl } as Entry;
          } catch (e) {
            console.error('Fehler beim Bild-Upload (NOTE):', e);
          }
        }
        // Attachment-Upload
        if (noteEntry.attachment?.url && /^data:/i.test(noteEntry.attachment.url)) {
          try {
            const uploadedAttachmentUrl = await storageService.uploadDataUrl(
              noteEntry.attachment.url,
              noteEntry.attachment.name || `attachment-${noteEntry.id}`
            );
            processedEntry = {
              ...(processedEntry as NoteEntry),
              attachment: { ...noteEntry.attachment, url: uploadedAttachmentUrl },
            } as Entry;
          } catch (e) {
            console.error('Fehler beim Attachment-Upload (NOTE):', e);
          }
        }
      }
    } catch (e) {
      console.error('Fehler beim Verarbeiten des Eintrags vor dem Speichern:', e);
    }

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
            entries: [processedEntry]
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
                  entry.id === processedEntry.id ? processedEntry : entry
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

  // Funktion zum manuellen Backup erstellen
  const createBackup = useCallback(() => {
    if (!trip) return;
    
    try {
      const backupData = JSON.stringify(trip);
      localStorage.setItem('andalusien-trip-backup', backupData);
      localStorage.setItem('andalusien-trip-backup-timestamp', Date.now().toString());
      console.log('✅ Manuelles Backup erstellt');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Backups:', error);
      return false;
    }
  }, [trip]);

  // Funktion zum Backup wiederherstellen
  const restoreBackup = useCallback(() => {
    try {
      // Prüfe zuerst das große Backup (bei Größenproblemen)
      let backupData = localStorage.getItem('andalusien-trip-backup-large');
      if (backupData) {
        const restoredTrip = JSON.parse(backupData);
        setTrip(restoredTrip);
        setError(null);
        console.log('✅ Großes Backup wiederhergestellt');
        return true;
      }
      
      // Dann das normale Backup
      backupData = localStorage.getItem('andalusien-trip-backup');
      if (backupData) {
        const restoredTrip = JSON.parse(backupData);
        setTrip(restoredTrip);
        setError(null);
        console.log('✅ Normales Backup wiederhergestellt');
        return true;
      }
      
      console.log('❌ Kein Backup gefunden');
      return false;
    } catch (error) {
      console.error('❌ Fehler beim Wiederherstellen des Backups:', error);
      return false;
    }
  }, []);

  // Funktion zum Export der Daten als JSON
  const exportData = useCallback(() => {
    if (!trip) return null;
    
    try {
      const exportData = {
        trip: trip,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `andalusien-trip-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Daten exportiert');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Export:', error);
      return false;
    }
  }, [trip]);

  // Funktion zum Import von JSON-Daten
  const importData = useCallback((file: File) => {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          if (importData.trip) {
            setTrip(importData.trip);
            setError(null);
            console.log('✅ Daten importiert');
            resolve(true);
          } else {
            console.error('❌ Ungültiges Import-Format');
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Fehler beim Import:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, []);

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
    createBackup,
    restoreBackup,
    exportData,
    importData,
  };
};