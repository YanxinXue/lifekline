import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { City, searchCities, CITIES } from '../data/cities';

interface CitySelectorProps {
  value: string;
  onChange: (longitude: number, cityName: string) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim() ? searchCities(query) : CITIES.slice(0, 15);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: City) => {
    setQuery('');
    setOpen(false);
    onChange(city.longitude, city.name);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3 h-3 text-green-600" />
        <label className="text-xs font-bold text-gray-600">出生地 (用于真太阳时校正)</label>
      </div>
      <input
        type="text"
        value={open ? query : value}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        placeholder="输入城市名搜索，如：北京、上海、成都..."
        className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {results.map((city, i) => (
            <button
              key={`${city.province}-${city.name}-${i}`}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm flex items-center justify-between border-b border-gray-50 last:border-0"
            >
              <span className="font-bold text-gray-800">{city.name}</span>
              <span className="text-xs text-gray-400">{city.province} · {city.longitude}°E</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          未找到匹配城市
        </div>
      )}
    </div>
  );
};

export default CitySelector;
