
import React from 'react';
import { FileCategory } from '../types';

interface FilterTabsProps {
  activeCategory: FileCategory;
  onCategoryChange: (cat: FileCategory) => void;
}

// Updated categories to match FileCategory type from types.ts
const categories: FileCategory[] = ['TODOS OS ATIVOS', 'DOCUMENTOS', 'FINANCEIROS', 'JURÍDICOS'];

const FilterTabs: React.FC<FilterTabsProps> = ({ activeCategory, onCategoryChange }) => {
  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-200 ${
            activeCategory === cat
              ? 'bg-white text-slate-900 shadow-lg'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
