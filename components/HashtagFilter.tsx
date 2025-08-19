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
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-medium text-slate-700">Trending Hashtags:</h3>
        {selectedHashtag && (
          <span className="text-xs text-slate-500">
            Zeige nur: {selectedHashtag}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topHashtags.map(({ hashtag, count }) => (
          <button
            key={hashtag}
            onClick={() => handleHashtagClick(hashtag)}
            className={`px-3 py-2 rounded-full border transition-all text-sm font-medium ${
              selectedHashtag === hashtag
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600'
            }`}
            title={`${selectedHashtag === hashtag ? 'Filter deaktivieren' : 'Nur ' + hashtag + ' anzeigen'} (${count}x)`}
          >
            {hashtag} <span className="text-xs opacity-70">({count})</span>
          </button>
        ))}
      </div>
      
      {selectedHashtag && (
        <div className="mt-3 text-center">
          <button
            onClick={() => onHashtagChange(null)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Alle Hashtags anzeigen
          </button>
        </div>
      )}
    </div>
  );
};

export default HashtagFilter; 