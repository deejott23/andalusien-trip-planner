import React, { useState } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<boolean>;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Bitte wähle eine gültige JSON-Datei aus.');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setError(null);

    try {
      const success = await onImport(selectedFile);
      if (success) {
        onClose();
        setSelectedFile(null);
      } else {
        setError('Import fehlgeschlagen. Überprüfe das Dateiformat.');
      }
    } catch (error) {
      setError('Fehler beim Import: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Daten importieren</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              JSON-Datei auswählen
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {selectedFile && (
            <div className="text-sm text-slate-600">
              <strong>Ausgewählte Datei:</strong> {selectedFile.name}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-500">
            💡 <strong>Hinweis:</strong> Nur JSON-Dateien, die von dieser App exportiert wurden, können importiert werden.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isImporting ? 'Importiere...' : 'Importieren'}
          </button>
        </div>
      </div>
    </div>
  );
} 