import { useState, useCallback, useEffect } from 'react';
import type { Trip, Day, Entry, LinkEntry, NoteEntry, Attachment, DaySeparatorEntry } from '../types';
import { EntryTypeEnum } from '../types';
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
import { tripService } from '../services/firebase';

const initialStations: Day[] = [
  {
    id: 'station-cadiz',
    title: 'Cádiz',
    duration: 4,
    color: 'orange',
    entries: [
       {
        id: 'day-sep-1',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 1: Ankunft & Erkundung',
        date: '2025-08-27',
      },
      {
        id: 'entry-cadiz-1',
        type: EntryTypeEnum.NOTE,
        content: '<p><b>Ankunft in Cádiz.</b> Hotel-Check-in und erster Spaziergang durch die historische Altstadt. Wir sollten uns die Kathedrale und den Torre Tavira ansehen.</p>',
        reactions: { likes: 1, dislikes: 0, userReaction: 'like' },
      },
      {
        id: 'entry-cadiz-2',
        type: EntryTypeEnum.LINK,
        url: 'https://www.spain.info/de/reiseziel/cadiz/',
        title: 'Cádiz: Sehenswürdigkeiten & Highlights',
        description: 'Offizieller Tourismus-Guide für Cádiz. Entdecke die älteste Stadt Westeuropas.',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
        domain: 'spain.info',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
       {
        id: 'day-sep-2',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 3: Kulinarik & Kultur',
        date: '2025-08-29',
      },
      {
        id: 'entry-cadiz-3',
        type: EntryTypeEnum.LINK,
        url: 'https://devourcadizfoodtours.com/blog/best-tapas-in-cadiz/',
        title: 'Die besten Tapas-Bars in Cádiz',
        description: 'Ein Guide zu den authentischsten und leckersten Tapas, die man in Cádiz finden kann.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        domain: 'devourcadizfoodtours.com',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
      {
        id: 'entry-cadiz-4',
        type: EntryTypeEnum.NOTE,
        content: '<p>Plan für heute:<ul><li>Morgens: Besuch des Mercado Central</li><li>Nachmittags: Entspannen am Strand La Caleta</li><li>Abends: Flamenco-Show</li></ul></p>',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      }
    ],
  },
  {
    id: 'station-marbella',
    title: 'Marbella',
    duration: 4,
    color: 'blue',
    entries: [
        {
        id: 'day-sep-3',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 5: Marbella & Puerto Banús',
        date: '2025-08-31',
      },
      {
        id: 'entry-marbella-1',
        type: EntryTypeEnum.NOTE,
        content: '<p><b>Fahrt von Cádiz nach Marbella.</b> Check-in im Hotel und erster Ausflug zum berühmten Hafen Puerto Banús.</p>',
         reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
      {
        id: 'entry-marbella-2',
        type: EntryTypeEnum.LINK,
        url: 'https://www.marbella.es/turismo/',
        title: 'Offizielle Tourismusseite von Marbella',
        description: 'Informationen zu Stränden, Altstadt und Aktivitäten in Marbella.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        domain: 'marbella.es',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
       {
        id: 'entry-marbella-3',
        type: EntryTypeEnum.NOTE,
        content: '<p>Tagesausflug nach Ronda geplant. Die Puente Nuevo Brücke soll atemberaubend sein.</p>',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
      {
        id: 'entry-marbella-4',
        type: EntryTypeEnum.LINK,
        url: 'https://www.tripadvisor.de/Attractions-g187439-Activities-c42-Marbella_Costa_del_Sol_Province_of_Malaga_Andalucia.html',
        title: 'Wanderwege in der Nähe von Marbella',
        description: 'Die besten Routen zum Wandern in der Sierra de las Nieves.',
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        domain: 'tripadvisor.de',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      }
    ],
  },
  {
    id: 'station-torrox',
    title: 'Torrox',
    duration: 7, 
    color: 'green',
    entries: [
        {
        id: 'day-sep-4',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 9: Ankunft in Torrox',
        date: '2025-09-04',
      },
      {
        id: 'entry-torrox-1',
        type: EntryTypeEnum.NOTE,
        content: '<p><b>Die letzte Station unserer Reise.</b> Zeit zum Entspannen am Strand und um die "weißen Dörfer" der Axarquía zu erkunden.</p>',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
      {
        id: 'entry-torrox-2',
        type: EntryTypeEnum.LINK,
        url: 'https://www.andalusien-tourismus.com/de/torrox',
        title: 'Torrox - Das beste Klima Europas',
        description: 'Informationen über Torrox Pueblo und Torrox Costa.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
        domain: 'andalusien-tourismus.com',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
      {
        id: 'day-sep-5',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 11: Ausflug nach Nerja',
        date: '2025-09-06',
      },
       {
        id: 'entry-torrox-3',
        type: EntryTypeEnum.LINK,
        url: 'https://www.turismonerja.com/de/hoehlen-von-nerja/',
        title: 'Höhlen von Nerja',
        description: 'Ein beeindruckendes Naturwunder, nur eine kurze Fahrt von Torrox entfernt.',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        domain: 'turismonerja.com',
        status: 'loaded',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      },
       {
        id: 'day-sep-6',
        type: EntryTypeEnum.DAY_SEPARATOR,
        title: 'Tag 15: Letzter Abend',
        date: '2025-09-10',
      },
      {
        id: 'entry-torrox-4',
        type: EntryTypeEnum.NOTE,
        content: '<p>Letztes Abendessen am Strand. Packen für den Rückflug morgen früh.</p>',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      }
    ],
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

  const addEntry = useCallback(async (dayId: string, type: EntryTypeEnum, data: { url?: string; content?: string; imageDataUrl?: string; attachment?: Attachment; title?: string; date?: string; }) => {
    if (!trip) return;
    
    let newEntry: Entry;
    const tempId = `entry-${Date.now()}`;
    
    // Spezielle Behandlung für "Vor dem Urlaub" Station
    if (dayId === 'before-trip') {
      // Erstelle die "Vor dem Urlaub" Station, falls sie nicht existiert
      const beforeTripDay = {
        id: 'before-trip',
        title: 'Vor dem Urlaub',
        duration: 0,
        color: 'gray',
        entries: []
      };
      
      // Füge die Station hinzu, falls sie nicht existiert
      if (!trip.days.some(day => day.id === 'before-trip')) {
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip;
          return {
            ...prevTrip,
            days: [beforeTripDay, ...prevTrip.days]
          };
        });
      }
    }
    
    if (type === EntryTypeEnum.DAY_SEPARATOR && data.title && data.date) {
        newEntry = {
            id: tempId,
            type: EntryTypeEnum.DAY_SEPARATOR,
            title: data.title,
            date: data.date,
        } as DaySeparatorEntry;
        
        setTrip(prevTrip => {
            if (!prevTrip) return prevTrip;
            return {
                ...prevTrip,
                days: prevTrip.days.map(day => {
                    if (day.id !== dayId) return day;
                    const newEntries = [...day.entries, newEntry];
                    // Sort entries to keep day separators in chronological order
                    newEntries.sort((a, b) => {
                        if (a.type === EntryTypeEnum.DAY_SEPARATOR && b.type === EntryTypeEnum.DAY_SEPARATOR) {
                            return new Date(a.date).getTime() - new Date(b.date).getTime();
                        }
                         if (a.type === EntryTypeEnum.DAY_SEPARATOR) return -1;
                         if (b.type === EntryTypeEnum.DAY_SEPARATOR) return 1;
                        return 0;
                    });
                    return { ...day, entries: newEntries };
                })
            };
        });
    }
    else if (type === EntryTypeEnum.LINK && data.url) {
      const url = data.url;
      const domain = new URL(url).hostname.replace('www.', '');
      
      const loadingEntry: LinkEntry = {
        id: tempId,
        type: EntryTypeEnum.LINK,
        url,
        title: 'Lade Metadaten...',
        description: url,
        imageUrl: data.imageDataUrl,
        domain,
        status: 'loading',
        reactions: { likes: 0, dislikes: 0, userReaction: null },
      };
      newEntry = loadingEntry;

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

      try {
        const metadata = await fetchUrlMetadata(url);
        const finalEntry: LinkEntry = {
          ...loadingEntry,
          title: metadata.title || url,
          description: metadata.description || '',
          imageUrl: data.imageDataUrl || metadata.imageUrl,
          status: 'loaded',
        };
        updateEntry(dayId, finalEntry);
      } catch (error) {
        console.error("Metadaten konnten nicht geladen werden:", error);
        const errorEntry: LinkEntry = {
          ...loadingEntry,
          title: "Vorschau fehlgeschlagen",
          description: url,
          status: 'error',
          imageUrl: data.imageDataUrl,
        };
        updateEntry(dayId, errorEntry);
      }
    } else if (type === EntryTypeEnum.NOTE && data.content) {
      newEntry = {
        id: tempId,
        type: EntryTypeEnum.NOTE,
        content: data.content,
        attachment: data.attachment,
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
                if (entry.id === entryId && (entry.type === EntryTypeEnum.LINK || entry.type === EntryTypeEnum.NOTE)) {
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
    updateEntryReaction 
  };
};