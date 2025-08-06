import React, { useState, useEffect, useRef } from 'react';
import type { Entry, InfoEntry, NoteEntry, DaySeparatorEntry, Reactions } from '../types';
import { EntryTypeEnum } from '../types';
import { TrashIcon, LinkIcon, FileTextIcon, EditIcon, PaperclipIcon, ArrowUpIcon, ArrowDownIcon, MoreHorizontalIcon, getCategoryIcon } from './Icons';
import Spinner from './Spinner';

// Drag Handle Icon
const DragHandleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
  </svg>
);

interface EntryCardProps {
  entry: Entry;
  entryIndex: number;
  totalEntries: number;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (direction: number) => void;
  onUpdateReaction: (reaction: 'like' | 'dislike') => void;
  setEntryRef: (entryId: string, el: HTMLElement | null) => void;
  dragAttributes?: any;
  dragListeners?: any;
}

const CardMenu: React.FC<{
    isOpen: boolean;
    menuRef: React.RefObject<HTMLDivElement>;
    onEdit: () => void;
    onDelete: () => void;
    onMove: (direction: number) => void;
    index: number;
    total: number;
}> = ({ isOpen, menuRef, onEdit, onDelete, onMove, index, total }) => {
    if (!isOpen) return null;

    const MenuItem = ({ onClick, children, className = '', disabled = false }: { onClick: () => void; children: React.ReactNode; className?: string, disabled?: boolean }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-slate-100 transition-colors ${className} ${disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div ref={menuRef} className="absolute top-9 right-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-40 py-1">
            <MenuItem onClick={() => onMove(-1)} disabled={index === 0}>
                <ArrowUpIcon className="w-4 h-4" /> Nach oben
            </MenuItem>
            <MenuItem onClick={() => onMove(1)} disabled={index === total - 1}>
                <ArrowDownIcon className="w-4 h-4" /> Nach unten
            </MenuItem>
            <div className="h-px bg-slate-100 my-1"></div>
            <MenuItem onClick={onEdit}>
                <EditIcon className="w-4 h-4" /> Bearbeiten
            </MenuItem>
            <MenuItem onClick={onDelete} className="text-red-600 hover:bg-red-50">
                <TrashIcon className="w-4 h-4" /> Löschen
            </MenuItem>
        </div>
    );
};





const Favicon: React.FC<{ domain: string }> = ({ domain }) => {
    const [error, setError] = useState(false);
    if (error) return <LinkIcon className="w-5 h-5 text-slate-500" />;
    return <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`} alt={`${domain} Favicon`} className="w-6 h-6 object-contain" onError={() => setError(true)} />;
};

const useCardMenu = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMenuOpen &&
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    return { isMenuOpen, setIsMenuOpen, menuRef, triggerRef };
};

const LinkCard: React.FC<{ 
  entry: InfoEntry; 
  onDelete: () => void; 
  onEdit: () => void; 
  onMove: (d:number)=>void; 
  onUpdateReaction: (reaction: 'like' | 'dislike') => void; 
  index: number; 
  total: number;
  dragAttributes?: any;
  dragListeners?: any;
}> = ({ entry, onDelete, onEdit, onMove, onUpdateReaction, index, total, dragAttributes, dragListeners }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const { isMenuOpen, setIsMenuOpen, menuRef, triggerRef } = useCardMenu();
  useEffect(() => { setImageLoadError(false); }, [entry.imageUrl]);

  if (entry.status === 'loading') {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex items-center p-4">
        <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0"><Spinner className="w-8 h-8 text-slate-400" /></div>
        <div className="ml-4 flex-grow"><h3 className="font-semibold text-slate-900 bg-slate-200 rounded animate-pulse w-3/4 h-5"></h3><p className="text-sm text-slate-500 bg-slate-200 rounded animate-pulse w-full h-4 mt-2"></p></div>
      </div>
    );
  }

  const hasImage = entry.status === 'loaded' && !!entry.imageUrl;
  
  const CardContent = () => {
    // Verbesserte Bild-Fehlerbehandlung
    if (hasImage && !imageLoadError) {
      return (
        <a href={entry.url} target="_blank" rel="noopener" className="flex items-center self-stretch overflow-hidden hover:bg-slate-50 transition-colors">
          <div className="w-24 flex-shrink-0 bg-slate-100 self-stretch">
            <img 
              src={entry.imageUrl!} 
              alt={entry.title} 
              className="w-full h-full object-cover" 
              onError={() => {
                console.log('Bild konnte nicht geladen werden:', entry.imageUrl);
                setImageLoadError(true);
              }}
              onLoad={() => {
                console.log('Bild erfolgreich geladen:', entry.imageUrl);
              }}
            />
          </div>
          <div className="p-3 flex flex-col min-w-0">
            <h3 className="font-semibold line-clamp-2 text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">{entry.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{entry.description || entry.domain}</p>
          </div>
        </a>
      );
    }
    
    // Fallback ohne Bild
    return (
       <a href={entry.url} target="_blank" rel="noopener" className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
        <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
          {entry.status === 'error' ? <LinkIcon className="w-5 h-5 text-slate-400" /> : <Favicon domain={entry.domain} />}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold line-clamp-2 text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">{entry.title}</h3>
          <p className="text-sm text-slate-500 truncate mt-1">{entry.description || entry.domain}</p>
        </div>
      </a>
    );
  };
  
  return (
    <div className="relative group bg-white border border-slate-200 rounded-lg shadow-sm transition-shadow hover:shadow-md flex flex-col">
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }} 
              className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer"
              title="Bearbeiten"
            >
                <EditIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }} 
              className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
              title="Löschen"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
            <button 
              ref={triggerRef} 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(prev => !prev);
              }} 
              className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing"
              {...dragAttributes}
              {...dragListeners}
              title="Weitere Optionen"
            >
                <MoreHorizontalIcon className="w-4 h-4" />
            </button>
        </div>
                 <CardMenu isOpen={isMenuOpen} menuRef={menuRef} onEdit={onEdit} onDelete={onDelete} onMove={onMove} index={index} total={total} />
         <CardContent/>
    </div>
  );
};

const NoteCard: React.FC<{ 
  entry: NoteEntry; 
  onDelete: () => void; 
  onEdit: () => void; 
  onMove: (d:number)=>void; 
  onUpdateReaction: (reaction: 'like' | 'dislike') => void; 
  index: number; 
  total: number;
  dragAttributes?: any;
  dragListeners?: any;
}> = ({ entry, onDelete, onEdit, onMove, onUpdateReaction, index, total, dragAttributes, dragListeners }) => {
  const { isMenuOpen, setIsMenuOpen, menuRef, triggerRef } = useCardMenu();
  
  // Entferne Leerzeilen aus dem Content
  const cleanContent = entry.content.replace(/(<p><br><\/p>)+/g, '<p><br></p>');
  
  // Extrahiere Domain aus URL für Anzeige
  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  return (
    <div className="relative group bg-amber-50 border border-amber-200 rounded-lg">
       <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onEdit();
             }} 
             className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer"
             title="Bearbeiten"
           >
               <EditIcon className="w-4 h-4" />
           </button>
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onDelete();
             }} 
             className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
             title="Löschen"
           >
               <TrashIcon className="w-4 h-4" />
           </button>
           <button 
             ref={triggerRef} 
             onClick={(e) => {
               e.stopPropagation();
               setIsMenuOpen(prev => !prev);
             }} 
             className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing"
             {...dragAttributes}
             {...dragListeners}
             title="Weitere Optionen"
           >
               <MoreHorizontalIcon className="w-4 h-4" />
           </button>
       </div>
       <CardMenu isOpen={isMenuOpen} menuRef={menuRef} onEdit={onEdit} onDelete={onDelete} onMove={onMove} index={index} total={total} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {getCategoryIcon(entry.category, 'w-5 h-5 text-amber-500 mt-1 flex-shrink-0')}
          <div className="w-full">
            {entry.title && (
              <h3 className="font-bold text-slate-800 mb-2">
                {entry.url ? (
                  <a 
                    href={entry.url} 
                    target="_blank" 
                    rel="noopener" 
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {entry.title}
                  </a>
                ) : (
                  entry.title
                )}
              </h3>
            )}
            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: cleanContent }} />
            
            {/* URL-Anzeige wenn vorhanden */}
            {entry.url && (
              <div className="mt-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <a 
                  href={entry.url} 
                  target="_blank" 
                  rel="noopener" 
                  className="text-sm text-amber-700 hover:text-amber-900 transition-colors cursor-pointer truncate"
                  title={entry.url}
                >
                  {getDomainFromUrl(entry.url)}
                </a>
              </div>
            )}
            
            {entry.attachment && (
              <div className="mt-3">
                {entry.attachment.mimeType.startsWith('image/') ? (
                  <img src={entry.attachment.url} alt="Notiz-Anhang" className="rounded-lg max-h-48 w-auto object-cover border border-amber-200" />
                ) : (
                  <a href={entry.attachment.url} download={entry.attachment.name} className="flex items-center gap-2 p-2 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors">
                    <PaperclipIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800 truncate">{entry.attachment.name}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DaySeparatorCard: React.FC<{ 
  entry: DaySeparatorEntry; 
  onDelete: () => void; 
  onEdit: () => void; 
  onMove: (d:number)=>void; 
  index: number; 
  total: number;
  dragAttributes?: any;
  dragListeners?: any;
}> = ({ entry, onDelete, onEdit, onMove, index, total, dragAttributes, dragListeners }) => {
    const { isMenuOpen, setIsMenuOpen, menuRef, triggerRef } = useCardMenu();
    const date = new Date(entry.date + 'T00:00:00');
    const day = date.toLocaleDateString('de-DE', { day: 'numeric' });
    const month = date.toLocaleDateString('de-DE', { month: 'short' });

    return (
        <div className="relative group flex items-center gap-4 py-2 my-4">
             <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onEdit();
                   }} 
                   className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer"
                   title="Bearbeiten"
                 >
                     <EditIcon className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onDelete();
                   }} 
                   className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                   title="Löschen"
                 >
                     <TrashIcon className="w-4 h-4" />
                 </button>
                 <button 
                   ref={triggerRef} 
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsMenuOpen(prev => !prev);
                   }} 
                   className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing"
                   {...dragAttributes}
                   {...dragListeners}
                   title="Weitere Optionen"
                 >
                     <MoreHorizontalIcon className="w-4 h-4" />
                 </button>
             </div>
            <CardMenu isOpen={isMenuOpen} menuRef={menuRef} onEdit={onEdit} onDelete={onDelete} onMove={onMove} index={index} total={total} />

            <div className="flex flex-col items-center justify-center self-stretch">
                <div className="w-px flex-grow bg-slate-300"></div>
                <div className="w-3 h-3 bg-slate-300 rounded-full my-1"></div>
                <div className="w-px flex-grow bg-slate-300"></div>
            </div>
            <div className="w-16 flex-shrink-0 text-center">
                <p className="font-bold text-lg text-slate-700">{day}.</p>
                <p className="text-sm text-slate-500">{month}</p>
            </div>
            <h3 className="text-xl font-bold text-slate-800 flex-grow">{entry.title}</h3>
        </div>
    )
};

const EntryCard: React.FC<EntryCardProps> = ({ entry, entryIndex, totalEntries, onMove, setEntryRef, onUpdateReaction, dragAttributes, dragListeners, ...props }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if(ref.current) {
        setEntryRef(entry.id, ref.current);
    }
    return () => setEntryRef(entry.id, null);
  }, [entry.id, setEntryRef]);
  
  const commonProps = {
      ...props,
      index: entryIndex,
      total: totalEntries,
      onMove,
      onUpdateReaction,
      dragAttributes,
      dragListeners
  };

  return (
    <div ref={ref} id={entry.id} className="scroll-mt-40" data-entry-type={entry.type}>
        {entry.type === EntryTypeEnum.DAY_SEPARATOR && <DaySeparatorCard entry={entry} onEdit={props.onEdit} onDelete={props.onDelete} onMove={onMove} index={entryIndex} total={totalEntries} dragAttributes={dragAttributes} dragListeners={dragListeners}/>}
        {entry.type === EntryTypeEnum.INFO && <LinkCard entry={entry} {...commonProps} />}
        {entry.type === EntryTypeEnum.NOTE && <NoteCard entry={entry} {...commonProps} />}
    </div>
  );
};

export default EntryCard;