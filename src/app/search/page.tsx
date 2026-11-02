'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Loader2,
  ChevronUp,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import {
  FilterSidebar,
  RecentSearches,
  AutocompleteDropdown,
  SearchResults,
  SearchTabs,
  EmptyState,
  SortDropdown,
  FilterChip,
} from '@/app/components/search';
import { PageHeader } from '@/app/components/layout';
import type { DramaCard } from '@/lib/types';

const popularTags = ['CEO', 'Balas Dendam', 'Pewaris', 'Vampir', 'Istri'];

export default function SearchPage() {
  const router = useRouter();
  const {
    query,
    filteredResults,
    filters,
    sort,
    activeTab,
    recentSearches,
    suggestions,
    isFilterOpen,
    hasMore,
    loading,
    searched,
    setQuery,
    setSort,
    setActiveTab,
    setIsFilterOpen,
    toggleProvider,
    toggleGenre,
    clearRecentSearches,
    removeRecentSearch,
    loadMore,
    resetFilters,
    search,
  } = useSearch();

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent, searchQuery?: string) => {
      e?.preventDefault();
      const q = searchQuery || query;
      if (!q.trim()) return;

      setShowAutocomplete(false);
      await search(q);
    },
    [query, search]
  );

  const handleSelectRecent = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      handleSearch(undefined, searchQuery);
    },
    [setQuery, handleSearch]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      handleSearch(undefined, suggestion);
    },
    [setQuery, handleSearch]
  );

  const handleSelectDrama = useCallback(
    (drama: DramaCard) => {
      router.push(`/dramas/${drama.id}`);
    },
    [router]
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeFilterCount = filters.providers.length + filters.genres.length;
  const hasFilters = activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <PageHeader
        title="Cari Drama"
        action={
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`p-2 rounded-lg transition-colors relative ${hasFilters
              ? 'bg-red-600 text-white'
              : 'text-neutral-400 hover:bg-neutral-900'
              }`}
            aria-label="Buka filter"
          >
            <SlidersHorizontal size={20} />
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <main className="p-4 space-y-6">
        {/* Search Input */}
        <div ref={autocompleteRef} className="relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                size={18}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari drama, genre, atau provider..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-600/30 text-sm"
              />
              {loading && (
                <Loader2
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 animate-spin"
                  size={18}
                />
              )}
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          <AutocompleteDropdown
            query={query}
            suggestions={suggestions}
            results={filteredResults}
            onSelect={handleSelectSuggestion}
            onSelectDrama={handleSelectDrama}
            isVisible={showAutocomplete && (suggestions.length > 0 || filteredResults.length > 0)}
          />
        </div>

        {/* Recent Searches */}
        {!searched && recentSearches.length > 0 && (
          <RecentSearches
            searches={recentSearches}
            onSelect={handleSelectRecent}
            onRemove={removeRecentSearch}
            onClearAll={clearRecentSearches}
          />
        )}

        {/* Popular Tags (only show before first search) */}
        {!searched && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest">
              Pencarian Populer
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSelectRecent(tag)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Section */}
        {searched && (
          <div className="space-y-4">
            {/* Tabs */}
            <SearchTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              resultCount={filteredResults.length}
            />

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                <span className="font-bold text-white">{filteredResults.length}</span>{' '}
                hasil untuk "{query}"
              </p>
              <SortDropdown value={sort} onChange={setSort} />
            </div>

            {/* Active Filter Chips */}
            <FilterChip
              filters={filters}
              onRemoveProvider={toggleProvider}
              onRemoveGenre={toggleGenre}
              onClearAll={resetFilters}
            />

            {/* Results Grid */}
            {filteredResults.length > 0 ? (
              <>
                <SearchResults results={filteredResults} />

                {/* Load More */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loading ? (
                      <div className="flex items-center space-x-2 text-neutral-500">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm font-medium">Memuat lebih...</span>
                      </div>
                    ) : (
                      <button
                        onClick={loadMore}
                        className="px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
                      >
                        Muat Lebih
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                query={query}
                onResetFilters={hasFilters ? resetFilters : undefined}
                hasFilters={hasFilters}
                activeProviders={filters.providers}
                activeGenres={filters.genres}
              />
            )}
          </div>
        )}
      </main>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onToggleProvider={toggleProvider}
        onToggleGenre={toggleGenre}
        onReset={resetFilters}
        onApply={() => {
          setIsFilterOpen(false);
          if (searched) {
            search();
          }
        }}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-red-600 rounded-full shadow-lg hover:bg-red-700 transition-colors z-30"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}
