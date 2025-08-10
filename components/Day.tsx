import React, { useState } from 'react';
import type { Day as DayType, Entry } from '../types';
import EntryCard from './EntryCard';
import { PlusIcon, TrashIcon, EditIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable Entry Card Component
const SortableEntryCard: React.FC<{
  entry: Entry;
  entryIndex: number;
  totalEntries: number;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (direction: number) => void;
  onUpdateReaction: (reaction: 'like' | 'dislike') => void;
  setEntryRef: (entryId: string, el: HTMLElement | null) => void;
}> = ({ entry, entryIndex, totalEntries, onDelete, onEdit, onMove, onUpdateReaction, setEntryRef }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <EntryCard
        entry={entry}
        entryIndex={entryIndex}
        totalEntries={totalEntries}
        onDelete={onDelete}
        onEdit={onEdit}
        onMove={onMove}
        onUpdateReaction={onUpdateReaction}
        setEntryRef={setEntryRef}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
};

const Day: React.FC<DayProps> = (props) => {
  const { day, dayIndex, totalDays, onMoveDay, onAddEntry, onDeleteDay, onUpdateDayTitle, onDeleteEntry, onEditEntry, onMoveEntry, onUpdateEntryReaction, setEntryRef } = props;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(day.title);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = day.entries.findIndex(entry => entry.id === active.id);
      const newIndex = day.entries.findIndex(entry => entry.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onMoveEntry(day.id, oldIndex, newIndex);
      }
    }
  };
  
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
            onClick={onDeleteDay}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Station löschen"
        >
            <TrashIcon className="w-5 h-5" />
        </button>
    </div>
  );

  return (
    <section id={day.id} className={`relative group bg-white rounded-2xl shadow-md p-3 sm:p-6 border-l-4 ${borderColorClass}`}>
      <DayActions />
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
          {isEditingTitle ? (
               <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 bg-slate-100 border-b-2 border-blue-500 focus:outline-none w-full"
                  autoFocus
              />
          ) : (
             <div className="flex items-center gap-2">
                 <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">
                    {day.title}
                </h2>
                 <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Titel bearbeiten"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                 <button
                    onClick={onAddEntry}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Eintrag hinzufügen"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
             </div>
          )}
      </div>
      
      <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={day.entries.map(entry => entry.id)}
            strategy={verticalListSortingStrategy}
          >
            {day.entries.map((entry, index) => (
              <SortableEntryCard
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
          </SortableContext>
        </DndContext>
        
        {/* Prominente Plus-Schaltfläche - immer sichtbar */}
        <div className="flex justify-center pt-3 sm:pt-4">
          <button
            onClick={onAddEntry}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            aria-label="Neuen Eintrag hinzufügen"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Eintrag hinzufügen</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Day;