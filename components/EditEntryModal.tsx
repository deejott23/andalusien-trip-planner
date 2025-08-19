import React, { useState, useEffect, useRef } from 'react';
import type { Entry, Attachment } from '../types';
import { EntryTypeEnum, CategoryEnum } from '../types';
import { XIcon, UploadCloudIcon, PaperclipIcon, getCategoryIcon } from './Icons';
import RichTextEditor from './RichTextEditor';


interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEntry: (entry: Entry) => void;
  entry: Entry | null;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ isOpen, onClose, onUpdateEntry, entry }) => {
  const [formData, setFormData] = useState<Entry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry && isOpen) {
      setFormData(entry);
    }
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleContentChange = (content: string) => {
    if (formData && (formData.type === EntryTypeEnum.INFO || formData.type === EntryTypeEnum.NOTE)) {
      setFormData({ ...formData, content });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleCategoryChange = (category: CategoryEnum) => {
    if (formData && (formData.type === EntryTypeEnum.INFO || formData.type === EntryTypeEnum.NOTE)) {
      setFormData({ ...formData, category });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData?.type === EntryTypeEnum.INFO) {
      // Prüfe Dateityp
      if (!file.type.startsWith('image/')) {
        alert('Bitte wähle nur Bilddateien aus.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.onerror = () => {
        alert('Fehler beim Lesen der Datei. Versuche eine andere Datei.');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
      if (formData?.type === EntryTypeEnum.INFO) {
          setFormData({ ...formData, imageUrl: undefined });
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData?.type === EntryTypeEnum.NOTE) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: Attachment = {
            url: reader.result as string,
            name: file.name,
            mimeType: file.type
        };
        setFormData({ ...formData, attachment: newAttachment });
      };
      reader.onerror = () => {
        alert('Fehler beim Lesen der Datei. Versuche eine andere Datei.');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
      if (formData?.type === EntryTypeEnum.NOTE) {
          const { attachment, ...rest } = formData;
          setFormData(rest);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onUpdateEntry(formData);
      onClose();
    }
  };

  const categories = [
    { value: CategoryEnum.INFORMATION, label: 'Information', icon: getCategoryIcon(CategoryEnum.INFORMATION, 'w-4 h-4') },
    { value: CategoryEnum.ROUTE, label: 'Route', icon: getCategoryIcon(CategoryEnum.ROUTE, 'w-4 h-4') },
    { value: CategoryEnum.AUSFLUG, label: 'Ausflug', icon: getCategoryIcon(CategoryEnum.AUSFLUG, 'w-4 h-4') },
    { value: CategoryEnum.ESSEN, label: 'Essen', icon: getCategoryIcon(CategoryEnum.ESSEN, 'w-4 h-4') },
    { value: CategoryEnum.UEBERNACHTEN, label: 'Übernachten', icon: getCategoryIcon(CategoryEnum.UEBERNACHTEN, 'w-4 h-4') },
    { value: CategoryEnum.FRAGE, label: 'Frage', icon: getCategoryIcon(CategoryEnum.FRAGE, 'w-4 h-4') },
  ];

  if (!formData) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Eintrag bearbeiten</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><XIcon /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {(formData.type === EntryTypeEnum.INFO || formData.type === EntryTypeEnum.NOTE) && (
              <>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Titel (Optional)</label>
                  <input 
                    id="title" 
                    name="title"
                    type="text" 
                    value={formData.title || ''} 
                    onChange={handleChange} 
                    placeholder="z.B. Restaurant Empfehlung" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategoryChange(cat.value)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                          formData.category === cat.value 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {cat.icon}
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">URL (Optional)</label>
                  <input 
                    id="url" 
                    name="url"
                    type="url" 
                    value={formData.url || ''} 
                    onChange={handleChange} 
                    placeholder="https://example.com" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">Inhalt *</label>
                  <RichTextEditor value={formData.content} onChange={handleContentChange} />
                </div>

                {formData.type === EntryTypeEnum.INFO && (
                  <div>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Eigenes Bild (Optional)</span>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    {formData.imageUrl ? (
                      <div className="relative">
                        <img src={formData.imageUrl} alt="Vorschau" className="w-full h-auto object-cover rounded-md" />
                        <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all">
                        <UploadCloudIcon className="w-6 h-6" />
                        <span className="text-sm">Bild hochladen</span>
                      </button>
                    )}
                  </div>
                )}

                {formData.type === EntryTypeEnum.NOTE && (
                  <div>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Anhang (Optional)</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    {formData.attachment ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <PaperclipIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{formData.attachment.name}</span>
                        </div>
                        <button type="button" onClick={removeAttachment} className="p-1 text-slate-400 hover:text-slate-600">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all">
                        <PaperclipIcon className="w-6 h-6" />
                        <span className="text-sm">Datei anhängen</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              Abbrechen
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEntryModal;