import React from 'react';

interface BackupPanelProps {
  onClose: () => void;
  onCreate: () => void;
  onRestore: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function BackupPanel({ onClose, onCreate, onRestore, onExport, onImport }: BackupPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg p-6 w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Backup Verwaltung</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="space-y-3">
          <button onClick={onCreate} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">💾 Backup erstellen</button>
          <button onClick={onRestore} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">🔄 Backup wiederherstellen</button>
          <button onClick={onExport} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">📤 Daten exportieren</button>
          <button onClick={onImport} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">📥 Daten importieren</button>
        </div>
      </div>
    </div>
  );
}
