import React, { useState, useEffect, useRef } from 'react';
import { EntryTypeEnum, Attachment, Day, DaySeparatorEntry } from '../types';
import { XIcon, LinkIcon, FileTextIcon, UploadCloudIcon, PaperclipIcon, CalendarIcon } from './Icons';
import Spinner from './Spinner';
import RichTextEditor from './RichTextEditor';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (type: EntryTypeEnum, data: { url?: string; content?: string; imageDataUrl?: string; attachment?: Attachment; title?: string; date?: string; }) => Promise<void>;
  station: Day | null;
  tripStartDate: string;
  allDays: Day[];
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onAddEntry, station, tripStartDate, allDays }) => {
  const [activeTab, setActiveTab] = useState<EntryTypeEnum>(EntryTypeEnum.LINK);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [daySeparatorTitle, setDaySeparatorTitle] = useState('');
  const [daySeparatorDate, setDaySeparatorDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const linkFileInputRef = useRef<HTMLInputElement>(null);
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setUrl('');
      setNote('');
      setImageDataUrl(null);
      setAttachment(null);
      setDaySeparatorTitle('');
      setDaySeparatorDate('');
      setActiveTab(EntryTypeEnum.LINK);
      setIsSubmitting(false);

      // Calculate available dates for the station, excluding already used ones
      if(station) {
        let stationStartDate = new Date(tripStartDate + 'T00:00:00');
        for(const s of allDays) {
          if(s.id === station.id) break;
          stationStartDate.setDate(stationStartDate.getDate() + s.duration);
        }

        const allStationDates = [];
        for(let i=0; i < station.duration; i++) {
          const date = new Date(stationStartDate);
          date.setDate(date.getDate() + i);
          allStationDates.push(date.toISOString().split('T')[0]);
        }
        
        const existingSeparatorDates = station.entries
            .filter((e): e is DaySeparatorEntry => e.type === EntryTypeEnum.DAY_SEPARATOR)
            .map(e => e.date);
            
        const filteredDates = allStationDates.filter(d => !existingSeparatorDates.includes(d));

        setAvailableDates(filteredDates);
        if(filteredDates.length > 0) {
          setDaySeparatorDate(filteredDates[0]);
        } else {
          setDaySeparatorDate('');
        }
      }
    }
  }, [isOpen, station, tripStartDate, allDays]);

  if (!isOpen) return null;

  const handleLinkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageDataUrl(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAttachment({ url: reader.result as string, name: file.name, mimeType: file.type }); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isNoteEmpty = !note || note.replace(/(<p><br><\/p>|\s)/g, '').length === 0;

    if (activeTab === EntryTypeEnum.LINK && url.trim()) {
      await onAddEntry(EntryTypeEnum.LINK, { url: url.trim(), imageDataUrl: imageDataUrl || undefined });
    } else if (activeTab === EntryTypeEnum.NOTE && !isNoteEmpty) {
      await onAddEntry(EntryTypeEnum.NOTE, { content: note, attachment: attachment || undefined });
    } else if (activeTab === EntryTypeEnum.DAY_SEPARATOR && daySeparatorTitle.trim() && daySeparatorDate) {
      await onAddEntry(EntryTypeEnum.DAY_SEPARATOR, { title: daySeparatorTitle.trim(), date: daySeparatorDate });
    } else {
        setIsSubmitting(false);
    }
  };
  
  const isNoteEmpty = !note || note.replace(/(<p><br><\/p>|\s)/g, '').length === 0;
  let canSubmit = false;
  if(activeTab === EntryTypeEnum.LINK) canSubmit = !!url.trim();
  else if (activeTab === EntryTypeEnum.NOTE) canSubmit = !isNoteEmpty;
  else if (activeTab === EntryTypeEnum.DAY_SEPARATOR) canSubmit = !!daySeparatorTitle.trim() && !!daySeparatorDate;


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Neuen Eintrag erstellen</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-50"><XIcon /></button>
        </div>
        
        <div className="p-2 bg-slate-100 mx-6 mt-6 rounded-lg grid grid-cols-3 gap-1">
            <button onClick={() => setActiveTab(EntryTypeEnum.LINK)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.LINK ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><LinkIcon className="w-4 h-4" /> Link</button>
            <button onClick={() => setActiveTab(EntryTypeEnum.NOTE)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.NOTE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><FileTextIcon className="w-4 h-4" /> Notiz</button>
            <button onClick={() => setActiveTab(EntryTypeEnum.DAY_SEPARATOR)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.DAY_SEPARATOR ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><CalendarIcon className="w-4 h-4" /> Tag</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {activeTab === EntryTypeEnum.LINK && (
                // Link form
                <><input type="file" ref={linkFileInputRef} onChange={handleLinkFileChange} accept="image/*" className="hidden" /><div><label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">Webseiten-URL</label><input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" autoFocus /></div><div><span className="block text-sm font-medium text-slate-700 mb-1">Eigenes Bild (Optional)</span>{imageDataUrl ? (<div className="relative"><img src={imageDataUrl} alt="Vorschau" className="w-full h-auto object-cover rounded-md" /><button type="button" onClick={() => setImageDataUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"><XIcon className="w-4 h-4" /></button></div>) : (<button type="button" onClick={() => linkFileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all"><UploadCloudIcon className="w-6 h-6" /><span className="text-sm">Bild hochladen</span></button>)}</div></>
            )}
            {activeTab === EntryTypeEnum.NOTE && (
                // Note form
                <><input type="file" ref={noteFileInputRef} onChange={handleNoteFileChange} className="hidden" /><div><label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">Deine Notiz</label><RichTextEditor value={note} onChange={setNote} placeholder="z.B. Tickets für die Alhambra buchen..." /></div><div><span className="block text-sm font-medium text-slate-700 mb-1">Anhang (Optional)</span>{attachment ? (<div className="relative p-2 border border-slate-200 rounded-md">{attachment.mimeType.startsWith('image/') ? <img src={attachment.url} alt="Anhang Vorschau" className="w-full h-auto object-cover rounded-md" /> : <div className="flex items-center gap-2"><PaperclipIcon className="w-5 h-5 text-slate-500"/><span className="text-sm text-slate-700 truncate">{attachment.name}</span></div>}<button type="button" onClick={() => setAttachment(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"><XIcon className="w-3 h-3" /></button></div>) : (<button type="button" onClick={() => noteFileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all"><UploadCloudIcon className="w-6 h-6" /><span className="text-sm">Datei oder Bild hochladen</span></button>)}</div></>
            )}
            {activeTab === EntryTypeEnum.DAY_SEPARATOR && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="daySeparatorTitle" className="block text-sm font-medium text-slate-700 mb-1">Titel des Tages</label>
                    <input id="daySeparatorTitle" type="text" value={daySeparatorTitle} onChange={(e) => setDaySeparatorTitle(e.target.value)} placeholder="z.B. Ankunft & Erkundung" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" autoFocus />
                  </div>
                  <div>
                    <label htmlFor="daySeparatorDate" className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                    <select id="daySeparatorDate" value={daySeparatorDate} onChange={(e) => setDaySeparatorDate(e.target.value)} disabled={availableDates.length === 0} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-100">
                      {availableDates.length > 0 ? (
                        availableDates.map(date => <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</option>)
                      ) : (
                        <option>Keine verfügbaren Daten</option>
                      )}
                    </select>
                  </div>
                </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end">
            <button type="submit" disabled={!canSubmit || isSubmitting} className="w-28 flex justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">{isSubmitting ? <Spinner /> : 'Erstellen'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal;