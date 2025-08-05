import React, { useState, useEffect, useMemo } from 'react';
import type { DaySeparatorEntry, Trip } from '../types';
import { XIcon } from './Icons';

interface EditDaySeparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEntry: (entry: DaySeparatorEntry) => void;
  entry: DaySeparatorEntry | null;
  trip: Trip | null;
}

const EditDaySeparatorModal: React.FC<EditDaySeparatorModalProps> = ({ isOpen, onClose, onUpdateEntry, entry, trip }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  // Generiere verfügbare Daten für die Reise
  const availableDates = useMemo(() => {
    if (!trip) return [];
    
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const dates: string[] = [];
    
    // Alle Daten zwischen Start und Ende generieren
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Bereits verwendete Daten entfernen
    const usedDates = new Set<string>();
    trip.days.forEach(day => {
      day.entries.forEach(entry => {
        if (entry.type === 'DAY_SEPARATOR' && entry.id !== entry?.id) {
          usedDates.add(entry.date);
        }
      });
    });
    
    return dates.filter(date => !usedDates.has(date));
  }, [trip, entry?.id]);

  useEffect(() => {
    if (entry && isOpen) {
      setTitle(entry.title);
      setDate(entry.date);
    }
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry && title.trim() && date) {
      onUpdateEntry({
        ...entry,
        title: title.trim(),
        date: date
      });
      onClose();
    }
  };

  const formInputClass = "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
  const formLabelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Tag bearbeiten</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow contents">
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className={formLabelClass}>Titel</label>
              <input 
                id="title" 
                name="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className={formInputClass}
                placeholder="z.B. Tag 1: Ankunft & Erkundung"
                required
              />
            </div>
            <div>
              <label htmlFor="date" className={formLabelClass}>Datum</label>
              <select 
                id="date" 
                name="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className={formInputClass}
                required
              >
                <option value="">Datum auswählen...</option>
                {availableDates.map(date => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('de-DE', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  });
                  return (
                    <option key={date} value={date}>
                      {dayName}, {formattedDate}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end flex-shrink-0">
            <button
              type="submit"
              disabled={!title.trim() || !date}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDaySeparatorModal; 