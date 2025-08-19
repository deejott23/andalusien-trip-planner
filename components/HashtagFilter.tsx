import React from 'react';

interface HashtagFilterProps {
  selectedHashtag: string | null;
  onHashtagChange: (hashtag: string | null) => void;
  allEntries: any[];
}

const HashtagFilter: React.FC<HashtagFilterProps> = ({ selectedHashtag, onHashtagChange, allEntries }) => {
  // Extrahiere alle Hashtags aus allen Einträgen
  const extractHashtags = (entries: any[]): string[] => {
    const hashtags: string[] = [];
    
    entries.forEach(entry => {
      // Hashtags aus dem hashtags-Array
      if (entry.hashtags && Array.isArray(entry.hashtags)) {
        entry.hashtags.forEach((tag: string) => {
          if (tag.startsWith('#')) {
            hashtags.push(tag);
          }
        });
      }
      
      // Hashtags aus dem content (HTML)
      if (entry.content) {
        const hashtagRegex = /#[\wäöüßÄÖÜ]+/g;
        const matches = entry.content.match(hashtagRegex);
        if (matches) {
          hashtags.push(...matches);
        }
      }
    });
    
    return hashtags;
  };

  // Zähle Hashtags und hole die Top 7
  const getTopHashtags = (): { hashtag: string; count: number }[] => {
    const allHashtags = extractHashtags(allEntries);
    const hashtagCounts: { [key: string]: number } = {};
    
    allHashtags.forEach(hashtag => {
      hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
    });
    
    return Object.entries(hashtagCounts)
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  };

  const topHashtags = getTopHashtags();

  const handleHashtagClick = (hashtag: string) => {
    if (selectedHashtag === hashtag) {
      // Hashtag deaktivieren - alle Einträge anzeigen
      onHashtagChange(null);
    } else {
      // Neuen Hashtag auswählen
      onHashtagChange(hashtag);
    }
  };

  if (topHashtags.length === 0) {
    return null; // Keine Hashtags vorhanden
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-lg p-2 mb-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-medium text-slate-600">#</h3>
        {selectedHashtag && (
          <span className="text-xs text-slate-500">
            {selectedHashtag}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {topHashtags.map(({ hashtag, count }) => (
          <button
            key={hashtag}
            onClick={() => handleHashtagClick(hashtag)}
            className={`px-2 py-1 rounded-md border transition-all text-xs font-medium ${
              selectedHashtag === hashtag
                ? 'border-blue-400 bg-blue-100 text-blue-700'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'
            }`}
            title={`${selectedHashtag === hashtag ? 'Filter deaktivieren' : 'Nur ' + hashtag + ' anzeigen'} (${count}x)`}
          >
            {hashtag.replace('#', '')} <span className="text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>
      
      {selectedHashtag && (
        <div className="mt-2 text-center">
          <button
            onClick={() => onHashtagChange(null)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Alle anzeigen
          </button>
        </div>
      )}
    </div>
  );
};

export default HashtagFilter; 