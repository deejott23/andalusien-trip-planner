import React, { useState, useEffect, useRef } from 'react';
import type { Entry, Attachment } from '../types';
import { EntryTypeEnum } from '../types';
import { XIcon, UploadCloudIcon, PaperclipIcon } from './Icons';
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
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry && isOpen) {
      setFormData(entry);
    }
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleNoteContentChange = (content: string) => {
    if (formData.type === EntryTypeEnum.NOTE) {
      setFormData({ ...formData, content });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleLinkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData?.type === EntryTypeEnum.LINK) {
      // Prüfe Dateigröße (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Datei ist zu groß. Maximale Größe: 5MB');
        return;
      }
      
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
  
  const removeLinkImage = () => {
      if (formData?.type === EntryTypeEnum.LINK) {
          setFormData({ ...formData, imageUrl: undefined });
      }
  };

  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData?.type === EntryTypeEnum.NOTE) {
      // Prüfe Dateigröße (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Datei ist zu groß. Maximale Größe: 5MB');
        return;
      }
      
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

  const removeNoteAttachment = () => {
      if (formData?.type === EntryTypeEnum.NOTE) {
          const { attachment, ...rest } = formData;
          setFormData(rest);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
       // Basic check to not submit empty <p><br></p> from rich text editor
      if(formData.type === EntryTypeEnum.NOTE) {
          const isNoteEmpty = !formData.content || formData.content.replace(/(<p><br><\/p>|\s)/g, '').length === 0;
          if(isNoteEmpty) return;
      }
      onUpdateEntry(formData);
    }
  };

  const formInputClass = "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
  const formLabelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Eintrag bearbeiten</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow contents">
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {formData && formData.type === EntryTypeEnum.LINK && (
              <>
                <div>
                  <label htmlFor="title" className={formLabelClass}>Titel</label>
                  <input id="title" name="title" value={formData.title || ''} onChange={handleChange} className={formInputClass} />
                </div>
                <div>
                  <label htmlFor="url" className={formLabelClass}>URL</label>
                  <input id="url" name="url" type="url" value={formData.url || ''} onChange={handleChange} className={formInputClass} />
                </div>
                <div>
                  <label htmlFor="description" className={formLabelClass}>Beschreibung</label>
                  <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} className={formInputClass} rows={3} />
                </div>
                <div>
                  <span className={formLabelClass}>Bild</span>
                  <input type="file" ref={fileInputRef} onChange={handleLinkFileChange} accept="image/*" className="hidden" />
                  {formData.imageUrl ? (
                    <div className="space-y-2">
                      <img src={formData.imageUrl} alt="Vorschau" className="w-full h-auto max-h-64 object-cover rounded-md border border-slate-200" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm w-full py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Bild ändern</button>
                        <button type="button" onClick={removeLinkImage} className="text-sm w-full py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Bild entfernen</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all">
                      <UploadCloudIcon className="w-6 h-6" />
                      <span className="text-sm">Bild hochladen</span>
                    </button>
                  )}
                </div>
              </>
            )}
            {formData && formData.type === EntryTypeEnum.NOTE && (
              <>
                <div>
                  <label className={formLabelClass}>Notiz</label>
                  <RichTextEditor value={formData.content} onChange={handleNoteContentChange} />
                </div>
                <div>
                  <span className={formLabelClass}>Anhang</span>
                  <input type="file" ref={noteFileInputRef} onChange={handleNoteFileChange} className="hidden" />
                  {formData.attachment ? (
                     <div className="space-y-2">
                        <div className="relative p-2 border border-slate-200 rounded-md">
                            {formData.attachment.mimeType.startsWith('image/') ?
                                <img src={formData.attachment.url} alt="Anhang Vorschau" className="w-full h-auto max-h-64 object-cover rounded-md" />
                                : <div className="flex items-center gap-2">
                                    <PaperclipIcon className="w-5 h-5 text-slate-500"/>
                                    <span className="text-sm text-slate-700 truncate">{formData.attachment.name}</span>
                                </div>
                            }
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => noteFileInputRef.current?.click()} className="text-sm w-full py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Datei ändern</button>
                            <button type="button" onClick={removeNoteAttachment} className="text-sm w-full py-2 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">Datei entfernen</button>
                        </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => noteFileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all">
                      <UploadCloudIcon className="w-6 h-6" />
                      <span className="text-sm">Datei oder Bild hochladen</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end flex-shrink-0">
            <button
              type="submit"
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

export default EditEntryModal;