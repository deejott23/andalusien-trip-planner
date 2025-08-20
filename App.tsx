import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTripData } from './hooks/useTripData';
import type { Entry, DaySeparatorEntry } from './types';
import { EntryTypeEnum } from './types';
import Timeline from './components/Timeline';
import Header from './components/Header';
import Day from './components/Day';
import AddDayModal from './components/AddDayModal';
import AddEntryModal from './components/AddEntryModal';
import EditEntryModal from './components/EditEntryModal';
import EditDaySeparatorModal from './components/EditDaySeparatorModal';
import ConfirmModal from './components/ConfirmModal';
import LoadingSpinner from './components/LoadingSpinner';
import ImportModal from './components/ImportModal';
import BackupPanel from './components/BackupPanel';

import { PlusIcon } from './components/Icons';

export default function App(): React.ReactNode {
  const {
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
  } = useTripData('andalusien-2025');

  const [isAddDayModalOpen, setAddDayModalOpen] = useState(false);
  const [addEntryModalState, setAddEntryModalState] = useState<{ isOpen: boolean; dayId: string | null }>({ isOpen: false, dayId: null });
  const [editEntryModalState, setEditEntryModalState] = useState<{ isOpen: boolean; dayId: string | null; entry: Entry | null }>({ isOpen: false, dayId: null, entry: null });
  const [editDaySeparatorModalState, setEditDaySeparatorModalState] = useState<{ isOpen: boolean; entry: DaySeparatorEntry | null }>({ isOpen: false, entry: null });
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [importModalState, setImportModalState] = useState<{ isOpen: boolean; file: File | null }>({ isOpen: false, file: null });
  const [showBackupPanel, setShowBackupPanel] = useState(false);
  
  const [activeDayEntryId, setActiveDayEntryId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryEnum | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const entryRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Debug-Info
  console.log('App Status:', { loading, error, trip: !!trip });

  // Hooks MÜSSEN vor allen bedingten Returns stehen!
  const daySeparatorEntries = trip?.days?.flatMap(day => 
    day.entries.filter((e): e is DaySeparatorEntry => e.type === EntryTypeEnum.DAY_SEPARATOR)
  ) || [];

  // Berechne Tage bis zur Reise
  const getDaysUntilTrip = () => {
    if (!trip?.startDate) return 0;
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    const diffTime = tripStart.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Erstelle eigenständige "Vor dem Urlaub" Station
  const beforeTripDay = useMemo(() => {
    if (!trip?.startDate) return null;
    
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    
    // Nur erstellen, wenn wir vor der Reise sind
    if (today >= tripStart) return null;
    
    const daysUntilTrip = getDaysUntilTrip();
    
    // Prüfe, ob bereits eine "Vor dem Urlaub" Station in trip.days existiert
    const existingBeforeTrip = trip.days.find(day => day.id === 'before-trip');
    
    return {
      id: 'before-trip',
      title: 'Vor dem Urlaub',
      duration: daysUntilTrip,
      color: 'gray',
      entries: [
        // Kein Tageseintrag mehr - nur bestehende Einträge
        ...(existingBeforeTrip?.entries.filter(entry => entry.id !== 'before-trip-separator') || [])
      ]
    };
  }, [trip?.startDate, trip?.days, getDaysUntilTrip]);

  // Kombiniere "Vor dem Urlaub" mit den anderen Tagen
  const allDays = useMemo(() => {
    if (!beforeTripDay) return trip?.days || [];
    
    // Entferne "Vor dem Urlaub" aus trip.days, falls vorhanden, um Duplikate zu vermeiden
    const otherDays = trip?.days.filter(day => day.id !== 'before-trip') || [];
    return [beforeTripDay, ...otherDays];
  }, [beforeTripDay, trip?.days]);
  
  // Erstelle eine echte "Vor dem Urlaub" Station in trip.days
  const tripWithBeforeTrip = useMemo(() => {
    if (!trip || !beforeTripDay) return trip;
    
    // Prüfe, ob "Vor dem Urlaub" bereits in trip.days existiert
    const beforeTripExists = trip.days.some(day => day.id === 'before-trip');
    
    if (!beforeTripExists) {
      return {
        ...trip,
        days: [beforeTripDay, ...trip.days]
      };
    }
    
    // Aktualisiere die bestehende "Vor dem Urlaub" Station mit beforeTripDay
    return {
      ...trip,
      days: trip.days.map(day => 
        day.id === 'before-trip' ? beforeTripDay : day
      )
    };
  }, [trip, beforeTripDay]);
  
  // Verwende tripWithBeforeTrip anstelle von trip für die Anzeige
  const displayTrip = tripWithBeforeTrip || trip;

  // Bestimme den Standard-Tag für die Navigation
  const getDefaultActiveDay = () => {
    if (!trip?.startDate || daySeparatorEntries.length === 0) return daySeparatorEntries[0]?.id || null;
    
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    const daysUntilTrip = getDaysUntilTrip();
    
    // Wenn heute vor der Reise liegt, starte mit "Vorm Urlaub"
    if (today < tripStart) {
      return 'virtual-before-trip';
    }
    
    // Ansonsten finde den passenden Reisetag
    const todayStr = today.toISOString().split('T')[0];
    const matchingDay = daySeparatorEntries.find(day => day.date >= todayStr);
    return matchingDay?.id || daySeparatorEntries[0]?.id;
  };
  
  useEffect(() => {
    // Set initial active day based on current date
    if (daySeparatorEntries.length > 0 && !activeDayEntryId) {
      const defaultDay = getDefaultActiveDay();
      setActiveDayEntryId(defaultDay);
    }
  }, [daySeparatorEntries, activeDayEntryId, trip?.startDate]);

  // ALLE Hooks müssen vor den bedingten Returns stehen!
  const [addAnchorEntryId, setAddAnchorEntryId] = useState<string | null>(null);
  const openAddEntryModal = useCallback((dayId: string, anchorEntryId?: string) => {
    setAddAnchorEntryId(anchorEntryId || null);
    setAddEntryModalState({ isOpen: true, dayId });
  }, []);

  const closeAddEntryModal = useCallback(() => {
    setAddAnchorEntryId(null);
    setAddEntryModalState({ isOpen: false, dayId: null });
  }, []);

  const openEditEntryModal = useCallback((dayId: string, entry: Entry) => {
    setEditEntryModalState({ isOpen: true, dayId, entry });
  }, []);

  const closeEditEntryModal = useCallback(() => {
    setEditEntryModalState({ isOpen: false, dayId: null, entry: null });
  }, []);

  const openEditDaySeparatorModal = useCallback((entry: DaySeparatorEntry) => {
    setEditDaySeparatorModalState({ isOpen: true, entry });
  }, []);

  const closeEditDaySeparatorModal = useCallback(() => {
    setEditDaySeparatorModalState({ isOpen: false, entry: null });
  }, []);

  const handleAddDay = useCallback((title: string) => {
    addDay(title);
    setAddDayModalOpen(false);
  }, [addDay]);

  const handleUpdateEntry = useCallback((updatedEntry: Entry) => {
    if (editEntryModalState.dayId) {
      updateEntry(editEntryModalState.dayId, updatedEntry);
    }
    closeEditEntryModal();
  }, [editEntryModalState.dayId, updateEntry, closeEditEntryModal]);

  const handleUpdateDaySeparatorEntry = useCallback((updatedEntry: DaySeparatorEntry) => {
    // Finde den Day, der diesen Entry enthält
    if (trip) {
      for (const day of trip.days) {
        const entryIndex = day.entries.findIndex(e => e.id === updatedEntry.id);
        if (entryIndex !== -1) {
          updateEntry(day.id, updatedEntry);
          break;
        }
      }
    }
    closeEditDaySeparatorModal();
  }, [trip, updateEntry, closeEditDaySeparatorModal]);

  const handleConfirmDeleteDay = useCallback((dayId: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Station löschen',
      message: 'Sind Sie sicher, dass Sie diese Station und alle zugehörigen Einträge löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
      onConfirm: () => {
        deleteDay(dayId);
        setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  }, [deleteDay]);

  const handleConfirmDeleteEntry = useCallback((entryId: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Eintrag löschen',
      message: 'Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?',
      onConfirm: () => {
        // Finde den korrekten dayId für diesen Eintrag
        let targetDayId = editEntryModalState.dayId;
        if (!targetDayId && displayTrip) {
          // Suche in allen Tagen (einschließlich "Vor dem Urlaub")
          for (const day of displayTrip.days) {
            const entryExists = day.entries.some(e => e.id === entryId);
            if (entryExists) {
              targetDayId = day.id;
              break;
            }
          }
        }
        
        if (targetDayId) {
          deleteEntry(targetDayId, entryId);
        }
        setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  }, [deleteEntry, editEntryModalState.dayId, displayTrip]);

  const handleScrollToDay = useCallback((dayEntryId: string) => {
    // 1) Wenn ein echter Tages-Eintrag existiert, dahin scrollen
    const entryEl = document.getElementById(dayEntryId);
    if (entryEl) {
      const y = entryEl.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveDayEntryId(dayEntryId);
      return;
    }

    // 2) Sonst handelt es sich um eine virtuelle ID → zur Station scrollen
    const virtualPrefix = 'virtual-';
    if (dayEntryId.startsWith(virtualPrefix)) {
      if (dayEntryId === 'virtual-before-trip') {
        const stationEl = document.getElementById('before-trip');
        if (stationEl) {
          const y = stationEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
      const parts = dayEntryId.split('-');
      if (parts.length >= 3) {
        const stationId = parts.slice(1, parts.length - 1).join('-');
        const stationEl = document.getElementById(`station-${stationId}`);
        if (stationEl) {
          const y = stationEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        return;
      }
    }

    // 3) Fallback
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!trip?.days) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isDaySeparator = entry.target.getAttribute('data-entry-type') === EntryTypeEnum.DAY_SEPARATOR;
          if (entry.isIntersecting && isDaySeparator) {
            setActiveDayEntryId(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    const currentRefs = entryRefs.current;
    currentRefs.forEach((ref) => observer.observe(ref));

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [trip?.days]);

  // Loading-Zustand anzeigen (mit Timeout)
  if (loading) {
    return (
      <div className="min-h-screen font-sans text-slate-800">
        <LoadingSpinner message="Reise wird geladen..." />
      </div>
    );
  }

  // Error-Zustand anzeigen
  if (error) {
    return (
      <div className="min-h-screen font-sans text-slate-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl text-slate-700 mb-2">Fehler beim Laden</h1>
            <p className="text-slate-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trip nicht verfügbar - Fallback mit Demo-Daten
  if (!trip) {
    return (
      <div className="min-h-screen font-slate-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl text-slate-700 mb-2">Reise nicht gefunden</h1>
            <p className="text-slate-600 mb-4">Lade Demo-Daten...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen font-sans text-slate-800">
        <header className="sticky top-0 z-20 bg-amber-50/80 backdrop-blur-lg shadow-sm">
                      <Timeline 
             stations={allDays}
             activeDayEntryId={activeDayEntryId}
             onDayClick={handleScrollToDay}
             tripStartDate={trip.startDate}
             selectedCategory={selectedCategory}
             onCategoryChange={setSelectedCategory}
             selectedHashtag={selectedHashtag}
             onHashtagChange={setSelectedHashtag}
             allEntries={allDays.flatMap(day => day.entries)}
           />
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <Header title={displayTrip?.title || ''} dateRange={displayTrip?.dateRange || ''} />
            <div className="space-y-4 sm:space-y-8 mt-4 sm:mt-8">
                {allDays.map((day, index) => {
                                         // Filtere Einträge basierend auf der ausgewählten Kategorie und Hashtags
                     let filteredEntries = day.entries;
                     
                     // Kategorie-Filter (falls aktiviert)
                     if (selectedCategory) {
                       filteredEntries = filteredEntries.filter(entry => {
                         if (entry.type === EntryTypeEnum.DAY_SEPARATOR || entry.type === EntryTypeEnum.SEPARATOR) {
                           return true; // Trennlinien immer anzeigen
                         }
                         return entry.category === selectedCategory;
                       });
                     }
                     
                     // Hashtag-Filter (falls aktiviert)
                     if (selectedHashtag) {
                       filteredEntries = filteredEntries.filter(entry => {
                         if (entry.type === EntryTypeEnum.DAY_SEPARATOR || entry.type === EntryTypeEnum.SEPARATOR) {
                           return true; // Trennlinien immer anzeigen
                         }
                         
                         // Prüfe hashtags-Array
                         if (entry.hashtags && Array.isArray(entry.hashtags)) {
                           if (entry.hashtags.includes(selectedHashtag)) {
                             return true;
                           }
                         }
                         
                         // Prüfe content auf Hashtags
                         if (entry.content && entry.content.includes(selectedHashtag)) {
                           return true;
                         }
                         
                         return false;
                       });
                     }
                    
                    // Erstelle gefilterten Tag
                    const filteredDay = { ...day, entries: filteredEntries };
                    
                    return (
                        <Day
                            key={day.id}
                            day={filteredDay}
                            dayIndex={index}
                            totalDays={allDays.length}
                            onMoveDay={moveDay}
                            onAddEntry={(anchorId) => openAddEntryModal(day.id, anchorId)}
                            onDeleteDay={() => handleConfirmDeleteDay(day.id)}
                            onUpdateDayTitle={(newTitle) => updateDay(day.id, { title: newTitle })}
                            onDeleteEntry={(entryId) => handleConfirmDeleteEntry(entryId)}
                            onEditEntry={(entry) => {
                              if (entry.type === EntryTypeEnum.DAY_SEPARATOR) {
                                openEditDaySeparatorModal(entry as DaySeparatorEntry);
                              } else {
                                openEditEntryModal(day.id, entry);
                              }
                            }}
                            onMoveEntry={moveEntry}
                            onUpdateEntryReaction={updateEntryReaction}
                            setEntryRef={(entryId, el) => {
                                if (el) {
                                    entryRefs.current.set(entryId, el);
                                } else {
                                    entryRefs.current.delete(entryId);
                                }
                            }}
                        />
                    );
                })}
            </div>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200/80 text-center space-y-4 hidden">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAddDayModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <PlusIcon />
                Neue Station hinzufügen
              </button>
              
              <button
                onClick={createBackup}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                💾 Backup erstellen
              </button>
              
              <button
                onClick={restoreBackup}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors shadow-sm"
              >
                🔄 Backup wiederherstellen
              </button>
              
              <button
                onClick={exportData}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors shadow-sm"
              >
                📤 Daten exportieren
              </button>
              
              <button
                onClick={() => setImportModalState({ isOpen: true, file: null })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition-colors shadow-sm"
              >
                📥 Daten importieren
              </button>
              
              {error && (
                <button
                  onClick={resetDatabase}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  🔄 Datenbank zurücksetzen
                </button>
              )}
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <strong>Fehler:</strong> {error}
                <br />
                <span className="text-xs">Die Datenbank wurde zu groß. Klicke "Datenbank zurücksetzen" um die Einträge wiederherzustellen.</span>
              </div>
            )}
            
            <div className="text-xs text-slate-500 space-y-1">
              <div>💡 <strong>Backup-System:</strong> Automatische Backups werden lokal gespeichert und bei Problemen wiederhergestellt.</div>
              <div>🛡️ <strong>Sicherheit:</strong> Größenprüfung verhindert Datenverlust. Export-Funktion für externe Backups.</div>
              <div>⏰ <strong>Empfehlung:</strong> Erstelle regelmäßig manuelle Backups und exportiere wichtige Daten.</div>
            </div>
                      </div>
          </main>

          {/* Footer */}
          <footer className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-3">
            <button onClick={() => setShowBackupPanel(true)} className="underline hover:text-slate-700">Backup</button>
            <span className="opacity-60">•</span>
            <span>Version: {import.meta.env.APP_VERSION}</span>
          </footer>

        <AddDayModal
          isOpen={isAddDayModalOpen}
          onClose={() => setAddDayModalOpen(false)}
          onAddDay={handleAddDay}
        />

        <AddEntryModal
          isOpen={addEntryModalState.isOpen}
          onClose={closeAddEntryModal}
          onAddEntry={async (entryType, data) => {
            if (addEntryModalState.dayId) {
              await addEntry(addEntryModalState.dayId, entryType, { ...data, _anchorEntryId: addAnchorEntryId || undefined });
              closeAddEntryModal();
            }
          }}
          station={allDays.find(d => d.id === addEntryModalState.dayId) || null}
          tripStartDate={displayTrip?.startDate || ''}
          allDays={allDays}
        />

                <EditEntryModal
          isOpen={editEntryModalState.isOpen}
          onClose={closeEditEntryModal}
          entry={editEntryModalState.entry}
          onUpdateEntry={handleUpdateEntry}
          allEntries={allDays.flatMap(day => day.entries)}
        />

        <EditDaySeparatorModal
          isOpen={editDaySeparatorModalState.isOpen}
          onClose={closeEditDaySeparatorModal}
          entry={editDaySeparatorModalState.entry}
          onUpdateEntry={handleUpdateDaySeparatorEntry}
          trip={trip}
        />

        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          onClose={() => setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          title={confirmModalState.title}
          message={confirmModalState.message}
          onConfirm={confirmModalState.onConfirm}
        />

        <ImportModal
          isOpen={importModalState.isOpen}
          onClose={() => setImportModalState({ isOpen: false, file: null })}
          onImport={importData}
        />

        {showBackupPanel && (
          <BackupPanel
            onClose={() => setShowBackupPanel(false)}
            onCreate={createBackup}
            onRestore={restoreBackup}
            onExport={exportData}
            onImport={() => { setShowBackupPanel(false); setImportModalState({ isOpen: true, file: null }); }}
          />
        )}
      </div>
    );
  }