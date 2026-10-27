import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useInventory();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`group relative flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-slate-600'
          : 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 shadow-sm'
      } ${className}`}
      aria-label={`Ubah ke ${isDark ? 'Mode Terang' : 'Mode Gelap'}`}
      title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </span>
      )}
    </button>
  );
};
