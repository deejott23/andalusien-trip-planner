import React from 'react';

interface HeaderProps {
    title: string;
    dateRange: string;
}

const Header: React.FC<HeaderProps> = ({ title, dateRange }) => {
    return (
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-lg text-slate-600">{dateRange}</p>
        </div>
    );
};

export default Header;
