import React from 'react';
import { CategoryEnum } from '../types';
import { getCategoryIcon } from './Icons';

interface CategoryFilterProps {
  selectedCategory: CategoryEnum | null;
  onCategoryChange: (category: CategoryEnum | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { value: CategoryEnum.INFORMATION, label: 'Information', icon: getCategoryIcon(CategoryEnum.INFORMATION, 'w-4 h-4') },
    { value: CategoryEnum.ROUTE, label: 'Route', icon: getCategoryIcon(CategoryEnum.ROUTE, 'w-4 h-4') },
    { value: CategoryEnum.AUSFLUG, label: 'Ausflug', icon: getCategoryIcon(CategoryEnum.AUSFLUG, 'w-4 h-4') },
    { value: CategoryEnum.ESSEN, label: 'Essen', icon: getCategoryIcon(CategoryEnum.ESSEN, 'w-4 h-4') },
    { value: CategoryEnum.UEBERNACHTEN, label: 'Übernachten', icon: getCategoryIcon(CategoryEnum.UEBERNACHTEN, 'w-4 h-4') },
    { value: CategoryEnum.FRAGE, label: 'Frage', icon: getCategoryIcon(CategoryEnum.FRAGE, 'w-4 h-4') },
  ];

  const handleCategoryClick = (category: CategoryEnum) => {
    if (selectedCategory === category) {
      // Kategorie deaktivieren - alle Einträge anzeigen
      onCategoryChange(null);
    } else {
      // Neue Kategorie auswählen
      onCategoryChange(category);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-medium text-slate-700">Kategorie-Filter:</h3>
        {selectedCategory && (
          <span className="text-xs text-slate-500">
            Zeige nur: {categories.find(cat => cat.value === selectedCategory)?.label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => handleCategoryClick(category.value)}
            className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
              selectedCategory === category.value
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
            title={`${selectedCategory === category.value ? 'Filter deaktivieren' : 'Nur ' + category.label + ' anzeigen'}`}
          >
            <div className={`${selectedCategory === category.value ? 'text-blue-600' : 'text-slate-600'}`}>
              {category.icon}
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {category.label}
            </span>
          </button>
        ))}
      </div>
      
      {selectedCategory && (
        <div className="mt-3 text-center">
          <button
            onClick={() => onCategoryChange(null)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Alle Kategorien anzeigen
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter; 