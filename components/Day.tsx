import React, { useState } from 'react';
import type { Day as DayType, Entry } from '../types';
import EntryCard from './EntryCard';
import { PlusIcon, TrashIcon, EditIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface DayProps {
  day: DayType;
  dayIndex: number;
  totalDays: number;
  onMoveDay: (fromIndex: number, toIndex: number) => void;
  onAddEntry: () => void;
  onDeleteDay: () => void;
  onUpdateDayTitle: (newTitle: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: Entry) => void;
  onMoveEntry: (dayId: string, fromIndex: number, toIndex: number) => void;
  onUpdateEntryReaction: (dayId: string, entryId: string, reaction: 'like' | 'dislike') => void;
  setEntryRef: (entryId: string, el: HTMLElement | null) => void;
}

const colorMapping: { [key: string]: string } = {
  orange: 'border-orange-400',
  blue: 'border-blue-400',
  green: 'border-green-400',
  gray: 'border-gray-400',
};

const Day: React.FC<DayProps> = (props) => {
  const { day, dayIndex, totalDays, onMoveDay, onAddEntry, onDeleteDay, onUpdateDayTitle, onDeleteEntry, onEditEntry, onMoveEntry, onUpdateEntryReaction, setEntryRef } = props;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(day.title);
  
  const borderColorClass = colorMapping[day.color] || colorMapping.gray;

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== day.title) {
      onUpdateDayTitle(title.trim());
    } else {
      setTitle(day.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(day.title);
      setIsEditingTitle(false);
    }
  };
  
  const DayActions = () => (
     <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
            disabled={dayIndex === 0}
            onClick={() => onMoveDay(dayIndex, dayIndex - 1)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Station nach oben verschieben"
        >
            <ArrowUpIcon className="w-5 h-5" />
        </button>
         <button
            disabled={dayIndex === totalDays - 1}
            onClick={() => onMoveDay(dayIndex, dayIndex + 1)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Station nach unten verschieben"
        >
            <ArrowDownIcon className="w-5 h-5" />
        </button>
        <button
            onClick={onAddEntry}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Eintrag hinzufügen"
        >
            <PlusIcon className="w-5 h-5" />
        </button>
        <button
            onClick={onDeleteDay}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Station löschen"
        >
            <TrashIcon className="w-5 h-5" />
        </button>
    </div>
  );

  return (
    <section className={`relative group bg-white rounded-2xl shadow-md p-4 sm:p-6 border-l-4 ${borderColorClass}`}>
      <DayActions />
      <div className="flex items-center gap-2 mb-4">
          {isEditingTitle ? (
               <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="text-2xl sm:text-3xl font-bold text-slate-800 bg-slate-100 border-b-2 border-blue-500 focus:outline-none w-full"
                  autoFocus
              />
          ) : (
             <div className="flex items-center gap-2">
                 <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {day.title}
                </h2>
                 <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Titel bearbeiten"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
             </div>
          )}
      </div>
      
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {day.entries.map((entry, index) => (
          <EntryCard
              key={entry.id}
              entry={entry}
              entryIndex={index}
              totalEntries={day.entries.length}
              onDelete={() => onDeleteEntry(entry.id)}
              onEdit={() => onEditEntry(entry)}
              onMove={(direction) => onMoveEntry(day.id, index, index + direction)}
              onUpdateReaction={(reaction) => onUpdateEntryReaction(day.id, entry.id, reaction)}
              setEntryRef={setEntryRef}
          />
        ))}
      </div>
    </section>
  );
};

export default Day;