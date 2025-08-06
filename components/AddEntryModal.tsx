import React, { useState, useEffect, useRef } from 'react';
import { EntryTypeEnum, CategoryEnum, Attachment, Day, DaySeparatorEntry, SeparatorEntry } from '../types';
import { XIcon, InfoIcon, FileTextIcon, UploadCloudIcon, PaperclipIcon, CalendarIcon, LinkIcon, MinusIcon, getCategoryIcon } from './Icons';
import Spinner from './Spinner';
import RichTextEditor from './RichTextEditor';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (type: EntryTypeEnum, data: { url?: string; content?: string; imageDataUrl?: string; attachment?: Attachment; title?: string; date?: string; category?: CategoryEnum; style?: 'line' | 'section' | 'divider'; }) => Promise<void>;
  station: Day | null;
  tripStartDate: string;
  allDays: Day[];
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onAddEntry, station, tripStartDate, allDays }) => {
  const [activeTab, setActiveTab] = useState<EntryTypeEnum>(EntryTypeEnum.NOTE);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryEnum>(CategoryEnum.INFORMATION);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [daySeparatorTitle, setDaySeparatorTitle] = useState('');
  const [daySeparatorDate, setDaySeparatorDate] = useState('');
  const [separatorTitle, setSeparatorTitle] = useState('');
  const [separatorStyle, setSeparatorStyle] = useState<'line' | 'section' | 'divider'>('line');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setTitle('');
      setUrl('');
      setContent('');
      setCategory(CategoryEnum.INFORMATION);
      setImageDataUrl(null);
      setAttachment(null);
      setDaySeparatorTitle('');
      setDaySeparatorDate('');
      setSeparatorTitle('');
      setSeparatorStyle('line');
      setActiveTab(EntryTypeEnum.NOTE);
      setIsSubmitting(false);

      // Calculate available dates for the station based on fixed time ranges
      if(station) {
        // Feste Zeiträume für jede Station
        const stationRanges = {
          'station-cadiz': { start: { day: 27, month: 8 }, end: { day: 31, month: 8 } },
          'station-marbella': { start: { day: 31, month: 8 }, end: { day: 4, month: 9 } },
          'station-torrox': { start: { day: 4, month: 9 }, end: { day: 11, month: 9 } }
        };
        
        const range = stationRanges[station.id];
        if (range) {
          const allStationDates = [];
          const startDate = new Date(2025, range.start.month - 1, range.start.day);
          const endDate = new Date(2025, range.end.month - 1, range.end.day);
          
          // Generiere alle Daten im Zeitraum
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            allStationDates.push(d.toISOString().split('T')[0]);
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
        } else {
          // Fallback für "Vor dem Urlaub" - keine Tageseinträge erlaubt
          setAvailableDates([]);
          setDaySeparatorDate('');
        }
      }
    }
  }, [isOpen, station, tripStartDate, allDays]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAttachment({ url: reader.result as string, name: file.name, mimeType: file.type }); };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageDataUrl(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isContentEmpty = !content || content.replace(/(<p><br><\/p>|\s)/g, '').length === 0;

    if (activeTab === EntryTypeEnum.NOTE && !isContentEmpty) {
      await onAddEntry(EntryTypeEnum.NOTE, { 
        title: title.trim() || undefined,
        content: content, 
        url: url.trim() || undefined,
        category: category,
        attachment: attachment || undefined,
        imageDataUrl: imageDataUrl || undefined
      });
    } else if (activeTab === EntryTypeEnum.DAY_SEPARATOR && daySeparatorTitle.trim() && daySeparatorDate) {
      await onAddEntry(EntryTypeEnum.DAY_SEPARATOR, { title: daySeparatorTitle.trim(), date: daySeparatorDate });
    } else if (activeTab === EntryTypeEnum.SEPARATOR) {
      await onAddEntry(EntryTypeEnum.SEPARATOR, { 
        title: separatorTitle.trim() || undefined,
        style: separatorStyle 
      });
    } else {
        setIsSubmitting(false);
    }
  };
  
  const isContentEmpty = !content || content.replace(/(<p><br><\/p>|\s)/g, '').length === 0;
  let canSubmit = false;
  if(activeTab === EntryTypeEnum.NOTE) canSubmit = !isContentEmpty;
  else if (activeTab === EntryTypeEnum.DAY_SEPARATOR) canSubmit = !!daySeparatorTitle.trim() && !!daySeparatorDate;
  else if (activeTab === EntryTypeEnum.SEPARATOR) canSubmit = true; // Separator kann immer erstellt werden

  const categories = [
    { value: CategoryEnum.INFORMATION, label: 'Information', icon: getCategoryIcon(CategoryEnum.INFORMATION, 'w-4 h-4') },
    { value: CategoryEnum.ROUTE, label: 'Route', icon: getCategoryIcon(CategoryEnum.ROUTE, 'w-4 h-4') },
    { value: CategoryEnum.AUSFLUG, label: 'Ausflug', icon: getCategoryIcon(CategoryEnum.AUSFLUG, 'w-4 h-4') },
    { value: CategoryEnum.ESSEN, label: 'Essen', icon: getCategoryIcon(CategoryEnum.ESSEN, 'w-4 h-4') },
    { value: CategoryEnum.UEBERNACHTEN, label: 'Übernachten', icon: getCategoryIcon(CategoryEnum.UEBERNACHTEN, 'w-4 h-4') },
    { value: CategoryEnum.FRAGE, label: 'Frage', icon: getCategoryIcon(CategoryEnum.FRAGE, 'w-4 h-4') },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Neuen Eintrag erstellen</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-50"><XIcon /></button>
        </div>
        
        <div className="p-2 bg-slate-100 mx-6 mt-6 rounded-lg grid grid-cols-3 gap-1">
            <button onClick={() => setActiveTab(EntryTypeEnum.NOTE)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.NOTE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><FileTextIcon className="w-4 h-4" /> Notiz</button>
            <button onClick={() => setActiveTab(EntryTypeEnum.DAY_SEPARATOR)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.DAY_SEPARATOR ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><CalendarIcon className="w-4 h-4" /> Tag</button>
            <button onClick={() => setActiveTab(EntryTypeEnum.SEPARATOR)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === EntryTypeEnum.SEPARATOR ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}><MinusIcon className="w-4 h-4" /> Trennlinie</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {activeTab === EntryTypeEnum.NOTE && (
                <>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Titel (Optional)</label>
                    <input 
                      id="title" 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
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
                          onClick={() => setCategory(cat.value)}
                          className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                            category === cat.value 
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
                      type="url" 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      placeholder="https://example.com" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">Inhalt *</label>
                    <RichTextEditor value={content} onChange={setContent} />
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Bild (Optional)</span>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    {imageDataUrl ? (
                      <div className="relative">
                        <img src={imageDataUrl} alt="Vorschau" className="w-full h-auto object-cover rounded-md" />
                        <button type="button" onClick={() => setImageDataUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
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

                  <div>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Anhang (Optional)</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    {attachment ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <PaperclipIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{attachment.name}</span>
                        </div>
                        <button type="button" onClick={() => setAttachment(null)} className="p-1 text-slate-400 hover:text-slate-600">
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
                </>
                        )}

            {activeTab === EntryTypeEnum.SEPARATOR && (
                <>
                  <div>
                    <label htmlFor="separatorTitle" className="block text-sm font-medium text-slate-700 mb-1">Titel (Optional)</label>
                    <input 
                      id="separatorTitle" 
                      type="text" 
                      value={separatorTitle} 
                      onChange={(e) => setSeparatorTitle(e.target.value)} 
                      placeholder="z.B. Aktivitäten am Vormittag" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="separatorStyle" className="block text-sm font-medium text-slate-700 mb-1">Stil</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSeparatorStyle('line')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                          separatorStyle === 'line'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="w-8 h-0.5 bg-current"></div>
                        <span className="text-xs font-medium">Einfache Linie</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeparatorStyle('section')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                          separatorStyle === 'section'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="w-8 h-1 bg-current rounded"></div>
                        <span className="text-xs font-medium">Abschnitt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeparatorStyle('divider')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                          separatorStyle === 'divider'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="w-8 h-0.5 bg-current relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-full"></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">Trenner</span>
                      </button>
                    </div>
                  </div>
                </>
            )}

            {activeTab === EntryTypeEnum.DAY_SEPARATOR && (
                <>
                  <div>
                    <label htmlFor="daySeparatorTitle" className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                    <input 
                      id="daySeparatorTitle" 
                      type="text" 
                      value={daySeparatorTitle} 
                      onChange={(e) => setDaySeparatorTitle(e.target.value)} 
                      placeholder="z.B. Anreise in Cádiz" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      autoFocus 
                    />
                  </div>
                  <div>
                    <label htmlFor="daySeparatorDate" className="block text-sm font-medium text-slate-700 mb-1">Datum *</label>
                    <select 
                      id="daySeparatorDate" 
                      value={daySeparatorDate} 
                      onChange={(e) => setDaySeparatorDate(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Datum auswählen</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">
              Abbrechen
            </button>
            <button type="submit" disabled={!canSubmit || isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? <Spinner size="sm" /> : null}
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal;