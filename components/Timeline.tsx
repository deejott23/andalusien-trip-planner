import React from 'react';
import type { Day, DaySeparatorEntry } from '../types';
import { EntryTypeEnum } from '../types';
import Countdown from './Countdown';
import { PlaneIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface TimelineProps {
  stations: Day[];
  activeDayEntryId: string | null;
  onDayClick: (dayEntryId: string) => void;
}

const colorMapping: { [key: string]: { bg: string, border: string, text: string } } = {
  orange: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-500' },
  blue: { bg: 'bg-blue-400', border: 'border-blue-500', text: 'text-blue-500' },
  green: { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-500' },
  gray: { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-500' },
};

const Timeline: React.FC<TimelineProps> = ({ stations, activeDayEntryId, onDayClick }) => {
  const daySeparatorEntries = stations.flatMap(station => 
    station.entries
      .filter((e): e is DaySeparatorEntry => e.type === EntryTypeEnum.DAY_SEPARATOR)
      .map(e => ({ ...e, stationColor: station.color, stationTitle: station.title }))
  ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (daySeparatorEntries.length === 0) return null;

  const totalDays = daySeparatorEntries.length;
  const activeDayIndex = daySeparatorEntries.findIndex(d => d.id === activeDayEntryId);
  const activeDay = activeDayIndex !== -1 ? daySeparatorEntries[activeDayIndex] : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-end gap-4 sm:gap-6">
        {/* Countdown - kompakter auf Mobile */}
        <div className="hidden sm:block">
          <Countdown startDate={daySeparatorEntries[0].date} />
        </div>
        
        {/* Mobile Countdown */}
        <div className="sm:hidden flex flex-col items-center text-xs">
          <div className="text-slate-600">Noch</div>
          <div className="font-bold text-lg">
            {Math.ceil((new Date(daySeparatorEntries[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-slate-600">Tage</div>
        </div>
        
        <div className="flex-grow pt-8 sm:pt-12 relative pb-4">
          
          {/* Active Day Title Tooltip */}
          {activeDay && (
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out"
            >
              <div className="relative px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap max-w-[200px] truncate">
                {activeDay.title}
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
              </div>
            </div>
          )}
          
          {/* Timeline Container mit Scroll */}
          <div className="relative w-full">
            <div className="relative w-full h-4 bg-teal-800 rounded-full flex items-center">
              {/* Slider Indicator */}
              {activeDayIndex !== -1 && totalDays > 1 && (
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-3 border-teal-600 rounded-full shadow-xl z-20 transition-all duration-300 ease-in-out pointer-events-none"
                  style={{ 
                    left: `${(activeDayIndex / (totalDays - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
              
              <div className="w-full flex justify-between items-center px-1 overflow-x-auto scrollbar-hide" style={{ minWidth: `${Math.max(totalDays * 60, 400)}px` }}>
                {daySeparatorEntries.map((dayEntry, index) => {
                  const colors = colorMapping[dayEntry.stationColor] || colorMapping.gray;
                  const date = new Date(dayEntry.date + 'T00:00:00');
                  const dayOfMonth = date.getDate();
                  const isActive = dayEntry.id === activeDayEntryId;

                  return (
                      <button 
                          key={dayEntry.id}
                          onClick={() => onDayClick(dayEntry.id)}
                          className={`rounded-full flex items-center justify-center text-white text-xs font-bold ${colors.bg} border-2 ${colors.border} shadow-md transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 ${isActive ? 'w-8 h-8 scale-110' : 'w-6 h-6'} flex-shrink-0 mx-1`}
                          aria-label={dayEntry.title}
                      >
                      {dayOfMonth}
                      </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Station Labels - Mobile optimiert */}
          <div className="w-full flex mt-2 overflow-x-auto scrollbar-hide" style={{ minWidth: `${Math.max(totalDays * 60, 400)}px` }}>
            {stations.map(station => {
                const daysInStation = daySeparatorEntries.filter(d => d.stationColor === station.color).length;
                const widthPercentage = totalDays > 0 ? (daysInStation / totalDays) * 100 : 0;
                const colors = colorMapping[station.color] || colorMapping.gray;
                return (
                    <div 
                        key={station.id} 
                        style={{ minWidth: `${Math.max(widthPercentage * 4, 80)}px` }} 
                        className={`text-center font-semibold text-xs sm:text-sm ${colors.text} flex-shrink-0 px-1`}
                    >
                        {station.title}
                    </div>
                );
            })}
          </div>
        </div>
        
        <div className="flex flex-col items-center text-slate-600 pb-2">
            <PlaneIcon className="w-6 h-6 sm:w-8 sm:h-8"/>
            <div className="h-2 w-px bg-slate-400 mt-1"></div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;