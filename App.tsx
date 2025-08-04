import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTripData } from './hooks/useTripData';
import type { Entry, DaySeparatorEntry } from './types';
import { EntryTypeEnum } from './types';
import Timeline from './components/Timeline';
import Header from './components/Header';
import Day from './components/Day';
import AddDayModal from './components/AddDayModal';
import AddEntryModal from './components/AddEntryModal';
import EditEntryModal from './components/EditEntryModal';
import ConfirmModal from './components/ConfirmModal';
import LoadingSpinner from './components/LoadingSpinner';
import DebugInfo from './components/DebugInfo';
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
  } = useTripData('andalusien-2025');

  const [isAddDayModalOpen, setAddDayModalOpen] = useState(false);
  const [addEntryModalState, setAddEntryModalState] = useState<{ isOpen: boolean; dayId: string | null }>({ isOpen: false, dayId: null });
  const [editEntryModalState, setEditEntryModalState] = useState<{ isOpen: boolean; dayId: string | null; entry: Entry | null }>({ isOpen: false, dayId: null, entry: null });
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [activeDayEntryId, setActiveDayEntryId] = useState<string | null>(null);
  const entryRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Debug-Info
  console.log('App Status:', { loading, error, trip: !!trip });

  // Hooks MÜSSEN vor allen bedingten Returns stehen!
  const daySeparatorEntries = trip?.days?.flatMap(day => 
    day.entries.filter((e): e is DaySeparatorEntry => e.type === EntryTypeEnum.DAY_SEPARATOR)
  ) || [];
  
  useEffect(() => {
    // Set initial active day to the first day separator if available
    if (daySeparatorEntries.length > 0 && !activeDayEntryId) {
      setActiveDayEntryId(daySeparatorEntries[0].id);
    }
  }, [daySeparatorEntries, activeDayEntryId]);

  // ALLE Hooks müssen vor den bedingten Returns stehen!
  const openAddEntryModal = useCallback((dayId: string) => {
    setAddEntryModalState({ isOpen: true, dayId });
  }, []);

  const closeAddEntryModal = useCallback(() => {
    setAddEntryModalState({ isOpen: false, dayId: null });
  }, []);

  const openEditEntryModal = useCallback((dayId: string, entry: Entry) => {
    setEditEntryModalState({ isOpen: true, dayId, entry });
  }, []);

  const closeEditEntryModal = useCallback(() => {
    setEditEntryModalState({ isOpen: false, dayId: null, entry: null });
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
        if (editEntryModalState.dayId) {
          deleteEntry(editEntryModalState.dayId, entryId);
        }
        setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  }, [deleteEntry, editEntryModalState.dayId]);

  const handleScrollToDay = useCallback((dayEntryId: string) => {
    setActiveDayEntryId(dayEntryId);
    const ref = entryRefs.current.get(dayEntryId);
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        <DebugInfo />
        <LoadingSpinner message="Reise wird geladen..." />
      </div>
    );
  }

  // Error-Zustand anzeigen
  if (error) {
    return (
      <div className="min-h-screen font-sans text-slate-800">
        <DebugInfo />
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
      <div className="min-h-screen font-sans text-slate-800">
        <DebugInfo />
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
        <DebugInfo />
        <header className="sticky top-0 z-20 bg-amber-50/80 backdrop-blur-lg shadow-sm">
           <Timeline 
            stations={trip.days}
            activeDayEntryId={activeDayEntryId}
            onDayClick={handleScrollToDay}
          />
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Header title={trip.title} dateRange={trip.dateRange} />
            <div className="space-y-8 mt-8">
                {trip.days.map((day, index) => (
                    <Day
                        key={day.id}
                        day={day}
                        dayIndex={index}
                        totalDays={trip.days.length}
                        onMoveDay={moveDay}
                        onAddEntry={() => openAddEntryModal(day.id)}
                        onDeleteDay={() => handleConfirmDeleteDay(day.id)}
                        onUpdateDayTitle={(newTitle) => updateDay(day.id, { title: newTitle })}
                        onDeleteEntry={(entryId) => handleConfirmDeleteEntry(entryId)}
                        onEditEntry={(entry) => openEditEntryModal(day.id, entry)}
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
                ))}
            </div>

          <div className="mt-8 pt-8 border-t border-slate-200/80 text-center">
            <button
              onClick={() => setAddDayModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <PlusIcon />
              Neue Station hinzufügen
            </button>
          </div>
        </main>

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
              await addEntry(addEntryModalState.dayId, entryType, data);
              closeAddEntryModal();
            }
          }}
          station={trip.days.find(d => d.id === addEntryModalState.dayId) || null}
          tripStartDate={trip.startDate}
          allDays={trip.days}
        />

        <EditEntryModal
          isOpen={editEntryModalState.isOpen}
          onClose={closeEditEntryModal}
          entry={editEntryModalState.entry}
          onUpdateEntry={handleUpdateEntry}
        />

        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          onClose={() => setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          title={confirmModalState.title}
          message={confirmModalState.message}
          onConfirm={confirmModalState.onConfirm}
        />
      </div>
  );
}