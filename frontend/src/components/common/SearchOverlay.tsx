import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '../ui/command';
import { History, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { mockCategories } from '../../data/mock';

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cde_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      setRecentSearches([]);
    }
  }, [open]);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('cde_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('cde_recent_searches');
    } catch {}
  };

  const handleSelectSearch = (term: string) => {
    saveRecentSearch(term);
    onOpenChange(false);
    navigate(`/katalog?q=${encodeURIComponent(term)}`);
  };

  const handleSelectCategory = (slug: string) => {
    onOpenChange(false);
    navigate(`/katalog?category=${encodeURIComponent(slug)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Cari kalung, cincin emas, mutiara AAA..." />
      <CommandList>
        <CommandEmpty>Tidak ada saran perhiasan ditemukan.</CommandEmpty>

        {/* Pencarian Terakhir */}
        {recentSearches.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center justify-between w-full">
                <span>Pencarian Terakhir</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentSearches();
                  }}
                  className="text-[10px] lowercase text-[var(--text-2)] hover:text-[#BA4E4E] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>
            }
          >
            {recentSearches.map((term) => (
              <CommandItem
                key={term}
                onSelect={() => handleSelectSearch(term)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[var(--text-2)]" />
                  <span>{term}</span>
                </div>
                <ArrowRight className="w-3 h-3 opacity-40" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentSearches.length > 0 && <CommandSeparator />}

        {/* Saran Kategori Mutiara */}
        <CommandGroup heading="Kategori Pilihan">
          {mockCategories.map((cat) => (
            <CommandItem
              key={cat.id}
              onSelect={() => handleSelectCategory(cat.slug)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877]" />
                <span className="font-medium">{cat.name}</span>
              </div>
              <span className="text-[10px] text-[var(--text-2)]">Koleksi Mutiara</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Kata Kunci Gemologi Populer */}
        <CommandGroup heading="Pencarian Populer">
          {['South Sea White Pearl', 'Golden South Sea', 'Tahitian Black Pearl', 'Grade AAA Mirror Luster'].map(
            (keyword) => (
              <CommandItem
                key={keyword}
                onSelect={() => handleSelectSearch(keyword)}
                className="flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8A6A2F] dark:bg-[#D9B877]" />
                <span>{keyword}</span>
              </CommandItem>
            )
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
