import React, { useState, useEffect, useRef } from 'react';
import type { Entry } from '../types';

interface HashtagInputProps {
  value: string[];
  onChange: (hashtags: string[]) => void;
  existingEntries: Entry[];
  placeholder?: string;
}

const HashtagInput: React.FC<HashtagInputProps> = ({ 
  value, 
  onChange, 
  existingEntries, 
  placeholder = "Hashtags hinzufügen..." 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Alle bestehenden Hashtags aus den Einträgen extrahieren
  const existingHashtags = React.useMemo(() => {
    const hashtagSet = new Set<string>();
    
    existingEntries.forEach(entry => {
      const textFields = [
        entry.title || '',
        entry.content || '',
        entry.description || ''
      ].filter(Boolean);
      
      textFields.forEach(text => {
        const hashtagRegex = /#([a-zA-ZäöüßÄÖÜ0-9]+)/g;
        let match;
        
        while ((match = hashtagRegex.exec(text)) !== null) {
          hashtagSet.add(match[1].toLowerCase());
        }
      });
    });
    
    return Array.from(hashtagSet).sort();
  }, [existingEntries]);

  // Hashtag-Vorschläge basierend auf der Eingabe generieren
  useEffect(() => {
    if (inputValue.trim()) {
      const input = inputValue.toLowerCase().replace('#', '');
      const filtered = existingHashtags
        .filter(tag => tag.includes(input) && !value.includes(tag))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, existingHashtags, value]);

  // Klick außerhalb schließt Vorschläge
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addHashtag = (hashtag: string) => {
    const cleanHashtag = hashtag.replace('#', '').trim().toLowerCase();
    if (cleanHashtag && !value.includes(cleanHashtag)) {
      onChange([...value, cleanHashtag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHashtag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addHashtag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeHashtag(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Hashtags (Optional)
      </label>
      
      {/* Bestehende Hashtags anzeigen */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((hashtag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
            >
              #{hashtag}
              <button
                type="button"
                onClick={() => removeHashtag(index)}
                className="ml-1 text-blue-500 hover:text-blue-700"
                title="Hashtag entfernen"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Eingabefeld */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Vorschläge */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addHashtag(suggestion)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
              >
                #{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Hilfetext */}
      <p className="text-xs text-slate-500 mt-1">
        Drücke Leertaste oder Enter um Hashtags hinzuzufügen. Verwende # um neue Hashtags zu erstellen.
      </p>
    </div>
  );
};

export default HashtagInput; 