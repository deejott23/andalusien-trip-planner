import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Day, DaySeparatorEntry } from '../types';
import { EntryTypeEnum } from '../types';
import { PlaneIcon } from './Icons';

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
}

// --- MAIN COMPONENT ---

const Timeline: React.FC<TimelineProps> = ({ stations, activeDayEntryId, onDayClick, tripStartDate }) => {
  const [width] = useWindowSize();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- DATA PREPARATION ---

  // Erstelle Timeline-Einträge für alle Stationen
  const timelineEntries = useMemo(() => {
    const entries = [];
    
    for (const station of stations) {
      // Spezielle Behandlung für "Vor dem Urlaub" - kein Tageseintrag
      if (station.title === 'Vor dem Urlaub') {
        entries.push({
          id: `virtual-${station.id}`,
          type: EntryTypeEnum.DAY_SEPARATOR,
          title: station.title,
          date: new Date().toISOString().split('T')[0], // Heute als Fallback
          stationColor: station.color,
          stationTitle: station.title
        });
        continue;
      }
      
      // Suche nach DAY_SEPARATOR Einträgen
      const separatorEntries = station.entries
        .filter((e): e is DaySeparatorEntry => e.type === EntryTypeEnum.DAY_SEPARATOR)
        .map(e => ({ ...e, stationColor: station.color, stationTitle: station.title }));
      
      if (separatorEntries.length > 0) {
        // Füge alle Tageseinträge hinzu
        entries.push(...separatorEntries);
      } else {
        // Wenn keine DAY_SEPARATOR Einträge vorhanden, erstelle einen virtuellen Eintrag
        entries.push({
          id: `virtual-${station.id}`,
          type: EntryTypeEnum.DAY_SEPARATOR,
          title: station.title,
          date: new Date().toISOString().split('T')[0], // Heute als Fallback
          stationColor: station.color,
          stationTitle: station.title
        });
      }
    }
    
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [stations]);
  
  const activeDayIndex = useMemo(() => {
    return timelineEntries.findIndex(d => d.id === activeDayEntryId);
  }, [timelineEntries, activeDayEntryId]);
  
  const activeDay = useMemo(() => activeDayIndex !== -1 ? timelineEntries[activeDayIndex] : null, [activeDayIndex, timelineEntries]);

  // --- LAYOUT LOGIC ---

  const layout = useMemo(() => {
    const totalDays = timelineEntries.length;
    if (totalDays === 0) return null;

    const isMobile = width < 768;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const dayNodeWidth = isMobile ? 45 : 55;
    
    const needsTwoRows = isMobile && totalDays * dayNodeWidth > containerWidth;
    
    const daysPerRow = needsTwoRows ? Math.ceil(totalDays / 2) : totalDays;
    const firstRowDays = timelineEntries.slice(0, daysPerRow);
    const secondRowDays = needsTwoRows ? timelineEntries.slice(daysPerRow).reverse() : [];

    return { needsTwoRows, firstRowDays, secondRowDays, daysPerRow, totalDays, isMobile };
  }, [timelineEntries, width, containerRef.current]);

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
    
    // Zeige den tatsächlichen Tag des Eintrags
    const getDayNumber = () => {
      // Verwende das tatsächliche Datum des Eintrags
      const entryDate = new Date(dayEntry.date);
      return entryDate.getDate();
    };
    
    return (
      <button
        key={dayEntry.id}
        onClick={() => onDayClick(dayEntry.id)}
        className={`relative rounded-full flex items-center justify-center text-white text-xs font-bold ${colors.bg} border-2 ${colors.border} shadow-md transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 ${isActive ? 'w-6 h-6 sm:w-7 sm:h-7 scale-110' : 'w-5 h-5'} flex-shrink-0`}
        aria-label={dayEntry.title}
      >
        {getDayNumber()}
      </button>
    );
  };

  const StationLabel = ({ days }: { days: typeof firstRowDays }) => {
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
            return (
                <div key={title} style={{ width: `${widthPercentage}%` }} className={`text-center font-semibold text-xs ${colors.text} flex-shrink-0 px-1 truncate`}>
                    {title}
                </div>
            );
        })}
      </div>
    );
  };
  



  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="relative pt-8">
        {activeDay && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out z-30">
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
            <StationLabel days={firstRowDays} />
            
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
                <StationLabel days={secondRowDays.slice().reverse()} />
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
