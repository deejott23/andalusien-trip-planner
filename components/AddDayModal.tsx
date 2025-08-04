

import React, { useState } from 'react';
import { XIcon } from './Icons';

interface AddDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDay: (title: string) => void;
}

const AddDayModal: React.FC<AddDayModalProps> = ({ isOpen, onClose, onAddDay }) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddDay(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Neue Station hinzufügen</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="dayTitle" className="block text-sm font-medium text-slate-700 mb-1">
              Titel der Station
            </label>
            <input
              id="dayTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Sevilla"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end">
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              Station hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDayModal;