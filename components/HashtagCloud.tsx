import React from 'react';
import type { Entry } from '../types';

interface HashtagCloudProps {
  entries: Entry[];
  onHashtagClick: (hashtag: string) => void;
}

interface HashtagInfo {
  text: string;
  count: number;
  entryIds: string[];
}

const HashtagCloud: React.FC<HashtagCloudProps> = ({ entries, onHashtagClick }) => {
  // Hashtags aus den Einträgen extrahieren
  const extractHashtags = (): HashtagInfo[] => {
    const hashtagMap = new Map<string, { count: number; entryIds: string[] }>();
    
    entries.forEach(entry => {
      // Alle Textfelder durchsuchen
      const textFields = [
        entry.title || '',
        entry.content || '',
        entry.description || ''
      ].filter(Boolean);
      
      textFields.forEach(text => {
        // Hashtags mit # finden (mindestens 2 Zeichen nach #)
        const hashtagRegex = /#([a-zA-ZäöüßÄÖÜ0-9]+)/g;
        let match;
        
        while ((match = hashtagRegex.exec(text)) !== null) {
          const hashtag = match[1].toLowerCase();
          const existing = hashtagMap.get(hashtag);
          
          if (existing) {
            if (!existing.entryIds.includes(entry.id)) {
              existing.count++;
              existing.entryIds.push(entry.id);
            }
          } else {
            hashtagMap.set(hashtag, { count: 1, entryIds: [entry.id] });
          }
        }
      });
    });
    
    // Nach Häufigkeit sortieren und auf 7 begrenzen
    return Array.from(hashtagMap.entries())
      .map(([text, info]) => ({ text, ...info }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  };
  
  const hashtags = extractHashtags();
  
  if (hashtags.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-600">Trending Topics:</span>
        <span className="text-xs text-slate-400">({hashtags.length} Tags)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((hashtag) => (
          <button
            key={hashtag.text}
            onClick={() => onHashtagClick(hashtag.text)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors cursor-pointer"
            title={`${hashtag.count} Einträge mit #${hashtag.text}`}
          >
            <span>#{hashtag.text}</span>
            <span className="text-blue-500 text-xs">({hashtag.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HashtagCloud; 