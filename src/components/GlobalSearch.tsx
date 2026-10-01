import React, { useState, useEffect, useRef } from 'react';
import { searchApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Search, X } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await searchApi.global(query, user?.permissions || []);
        setResults(response.data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl card animate-scaleIn">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در محصولات، مشتریان، تعمیرات، فاکتورها..."
            className="flex-1 bg-transparent outline-none text-base"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-slate-500">
              در حال جستجو...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              نتیجه‌ای یافت نشد
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onNavigate(result.page);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-right transition-colors"
                >
                  <div className="flex-shrink-0">
                    <span className="badge badge-info text-xs">
                      {result.type}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {result.label}
                    </p>
                    {result.sublabel && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {result.sublabel}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              حداقل ۲ کاراکتر وارد کنید
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-center">
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Esc</kbd> برای بستن
        </div>
      </div>
    </div>
  );
}
