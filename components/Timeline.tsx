import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Day, DaySeparatorEntry } from '../types';
import { EntryTypeEnum, CategoryEnum } from '../types';
import { PlaneIcon } from './Icons';
import CategoryFilter from './CategoryFilter';
import HashtagFilter from './HashtagFilter';

// --- HELPER HOOKS & COMPONENTS ---

const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const colorMapping: { [key: string]: { bg: string, border: string, text: string, track: string } } = {
  orange: { bg: 'bg-orange-400', border: 'border-orange-600', text: 'text-orange-600', track: 'bg-orange-200' },
  blue: { bg: 'bg-blue-400', border: 'border-blue-600', text: 'text-blue-600', track: 'bg-blue-200' },
  green: { bg: 'bg-green-400', border: 'border-green-600', text: 'text-green-600', track: 'bg-green-200' },
  gray: { bg: 'bg-gray-400', border: 'border-gray-600', text: 'text-gray-500', track: 'bg-gray-300' },
};

// --- PROPS ---

interface TimelineProps {
  stations: Day[];
  activeDayEntryId: string | null;
  onDayClick: (dayEntryId: string) => void;
  tripStartDate: string;
  selectedCategory: CategoryEnum | null;
  onCategoryChange: (category: CategoryEnum | null) => void;
  selectedHashtag: string | null;
  onHashtagChange: (hashtag: string | null) => void;
  allEntries: any[];
}

// --- MAIN COMPONENT ---

const Timeline: React.FC<TimelineProps> = ({ stations, activeDayEntryId, onDayClick, tripStartDate, selectedCategory, onCategoryChange, selectedHashtag, onHashtagChange, allEntries }) => {
  const [width] = useWindowSize();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- DATA PREPARATION ---

  // Feste Timeline-Einträge unabhängig von unteren Tagesänderungen
  const timelineEntries = useMemo(() => {
    const fixed = [
      { id: 'virtual-before-trip', type: EntryTypeEnum.DAY_SEPARATOR as const, title: 'Vor dem Urlaub', date: '', stationColor: 'gray', stationTitle: 'Vor dem Urlaub' },
      { id: 'virtual-station-cadiz-0', type: EntryTypeEnum.DAY_SEPARATOR as const, title: 'Cádiz', date: '2025-08-27', stationColor: 'orange', stationTitle: 'Cádiz' },
      { id: 'virtual-station-marbella-0', type: EntryTypeEnum.DAY_SEPARATOR as const, title: 'Marbella', date: '2025-08-31', stationColor: 'blue', stationTitle: 'Marbella' },
      { id: 'virtual-station-torrox-0', type: EntryTypeEnum.DAY_SEPARATOR as const, title: 'Torrox', date: '2025-09-04', stationColor: 'green', stationTitle: 'Torrox' },
    ];
    return fixed as any;
  }, []);
  
  const activeDayIndex = useMemo(() => {
    return timelineEntries.findIndex(d => d.id === activeDayEntryId);
  }, [timelineEntries, activeDayEntryId]);
  
  const activeDay = useMemo(() => activeDayIndex !== -1 ? timelineEntries[activeDayIndex] : null, [activeDayIndex, timelineEntries]);

  // --- LAYOUT LOGIC ---

  const layout = useMemo(() => {
    const totalDays = timelineEntries.length;
    if (totalDays === 0) return null;

    const isMobile = width < 768;
    const firstRowDays = timelineEntries;
    const secondRowDays: typeof timelineEntries = [] as any;

    return { needsTwoRows: false, firstRowDays, secondRowDays, daysPerRow: totalDays, totalDays, isMobile };
  }, [timelineEntries, width]);

  if (!layout) return null;
  const { needsTwoRows, firstRowDays, secondRowDays, daysPerRow, totalDays, isMobile } = layout;


  // --- SUB-COMPONENTS ---

  const DayNode = ({ dayEntry }: { dayEntry: typeof timelineEntries[0] }) => {
    const colors = colorMapping[dayEntry.stationColor] || colorMapping.gray;
    const isActive = dayEntry.id === activeDayEntryId;
    
    // Spezielle Behandlung für "Vorm Urlaub" - kein Tageseintrag mehr
    if (dayEntry.stationTitle === 'Vor dem Urlaub') {
      return (
        <button
          key={dayEntry.id}
          onClick={() => onDayClick(dayEntry.id)}
          className={`relative rounded-full flex items-center justify-center text-white text-xs font-bold ${colors.bg} border-2 ${colors.border} shadow-md transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 ${isActive ? 'w-6 h-6 sm:w-7 sm:h-7 scale-110' : 'w-5 h-5'} flex-shrink-0`}
          aria-label={dayEntry.title}
        >
          <span className="text-[10px]">V</span>
        </button>
      );
    }
    
    return (
      <button
        key={dayEntry.id}
        onClick={() => onDayClick(dayEntry.id)}
        className={`relative rounded-full flex items-center justify-center text-white text-xs font-bold ${colors.bg} border-2 ${colors.border} shadow-md transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 ${isActive ? 'w-6 h-6 sm:w-7 sm:h-7 scale-110' : 'w-5 h-5'} flex-shrink-0`}
        aria-label={dayEntry.title}
      >
        {/* Kreis ohne großen Text, Label unten */}
      </button>
    );
  };

  const StationLabel = ({ days, onLabelClick }: { days: typeof firstRowDays, onLabelClick: (dayEntryId: string) => void }) => {
    const stationGroups = days.reduce((acc, day) => {
        const title = day.stationTitle;
        if (!acc[title]) {
            acc[title] = { count: 0, color: day.stationColor };
        }
        acc[title].count++;
        return acc;
    }, {} as { [key: string]: { count: number, color: string } });

    return (
      <div className="w-full flex">
        {Object.entries(stationGroups).map(([title, {count, color}]) => {
            const widthPercentage = (count / days.length) * 100;
            const colors = colorMapping[color] || colorMapping.gray;
            const firstEntryForStation = days.find(d => d.stationTitle === title);
            const targetId = firstEntryForStation?.id;
            return (
                <div
                  key={title}
                  style={{ width: `${widthPercentage}%` }}
                  className={`text-center font-semibold text-xs ${colors.text} flex-shrink-0 px-1 truncate cursor-pointer select-none`}
                  role="button"
                  tabIndex={0}
                  onClick={() => targetId && onLabelClick(targetId)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && targetId) {
                      e.preventDefault();
                      onLabelClick(targetId);
                    }
                  }}
                >
                  {title}
                </div>
            );
        })}
      </div>
    );
  };
  



  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Kategorie-Filter über der Timeline */}
              {/* Hashtag Filter über der Timeline */}
        <HashtagFilter 
          selectedHashtag={selectedHashtag} 
          onHashtagChange={onHashtagChange} 
          allEntries={allEntries}
        />
      
      <div className="relative pt-8">
        {activeDay && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out z-30 pointer-events-none">
            <div className="relative px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap">
              {activeDay.title}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
             <PlaneIcon className="w-6 h-6 sm:w-7 sm:h-7" />
             <p className="text-xs font-bold mt-1">Start</p>
          </div>

          <div className="flex-grow space-y-3" ref={containerRef}>
            {/* --- First Row --- */}
            <div className="relative">
              <div className="h-2 bg-slate-200 rounded-full" />
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
                {firstRowDays.map(d => <DayNode key={d.id} dayEntry={d} />)}
              </div>
            </div>
            {/* Labels unter der Linie: fester Satz inkl. Zeiträume */}
            <div className="w-full flex">
              {firstRowDays.map((d) => {
                const colors = colorMapping[d.stationColor] || colorMapping.gray;
                const widthPercentage = 100 / firstRowDays.length;
                const ranges: Record<string, string> = { 'Vor dem Urlaub': 'V', 'Cádiz': '27–31', 'Marbella': '31–4', 'Torrox': '4–11' };
                return (
                  <div
                    key={d.id}
                    style={{ width: `${widthPercentage}%` }}
                    className={`text-center px-1 cursor-pointer select-none`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onDayClick(d.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick(d.id); } }}
                  >
                    <div className={`font-semibold text-xs ${colors.text}`}>{d.stationTitle}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{ranges[d.stationTitle] || ''}</div>
                  </div>
                );
              })}
            </div>
            
            {/* --- U-Turn & Second Row --- */}
            {needsTwoRows && (
              <>
                <div className="flex justify-end pr-2 h-4">
                  <div className="w-8 h-full border-r-2 border-b-2 border-slate-300 rounded-br-lg" />
                </div>

                <div className="relative">
                  <div className="h-2 bg-slate-200 rounded-full" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
                    {secondRowDays.map(d => <DayNode key={d.id} dayEntry={d} />)}
                  </div>
                </div>
                <StationLabel days={secondRowDays.slice().reverse()} onLabelClick={onDayClick} />
              </>
            )}
          </div>

          <div className="flex flex-col items-center justify-center h-full text-slate-500">
             <PlaneIcon className="w-6 h-6 sm:w-7 sm:h-7" />
             <p className="text-xs font-bold mt-1">Ende</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
