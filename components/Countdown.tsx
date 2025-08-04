import React, { useState, useEffect } from 'react';
import { PlaneIcon } from './Icons';

interface CountdownProps {
  startDate: string;
}

const Countdown: React.FC<CountdownProps> = ({ startDate }) => {
  const calculateDaysLeft = () => {
    const tripDate = new Date(startDate + 'T00:00:00');
    const now = new Date();
    const diffTime = tripDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const [daysLeft, setDaysLeft] = useState(calculateDaysLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setDaysLeft(calculateDaysLeft());
    }, 1000 * 60 * 60); // Update once per hour

    return () => clearInterval(timer);
  }, [startDate]);

  return (
    <div className="flex flex-col items-center text-slate-600">
      <p className="text-xs font-semibold">Noch</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-slate-800">{daysLeft}</span>
        <PlaneIcon className="w-8 h-8 transform -rotate-90" />
      </div>
      <p className="text-xs font-semibold">Tage</p>
    </div>
  );
};

export default Countdown;
