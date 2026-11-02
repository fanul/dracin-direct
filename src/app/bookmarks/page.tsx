'use client';

import PageHeader from '../components/layout/PageHeader';
import { BookmarkCard } from '../components/pages/BookmarkCard';
import { EmptyBookmarks } from '../components/pages/EmptyBookmarks';
import { useBookmarks } from '../../hooks/useBookmarks';

export default function BookmarksPage() {
    const {
        bookmarks,
        loading,
        error,
        isEditMode,
        selectedIds,
        toggleEditMode,
        toggleSelect,
        selectAll,
        deleteSelected,
        clearAll,
        removeBookmark,
        totalCount,
    } = useBookmarks();

    const hasBookmarks = totalCount > 0;

    return (
        <main className="min-h-screen bg-neutral-950 pb-24">
            {/* Header */}
            <PageHeader
                title="Bookmark Saya"
                action={
                    hasBookmarks && (
                        <button
                            onClick={toggleEditMode}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isEditMode
                                    ? 'bg-red-600 text-white'
                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                }`}
                        >
                            {isEditMode ? 'Selesai' : 'Edit'}
                        </button>
                    )
                }
            />

            {/* Content */}
            <div className="pt-20 px-4">
                {/* Bookmark Count */}
                {!loading && hasBookmarks && (
                    <p className="text-sm text-neutral-400 mb-4">
                        {totalCount} Drama Disimpan
                    </p>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && !hasBookmarks && <EmptyBookmarks />}

                {/* Bookmarks Grid */}
                {!loading && hasBookmarks && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {bookmarks.map((bookmark) => (
                            <BookmarkCard
                                key={bookmark.id}
                                bookmark={bookmark}
                                isEditMode={isEditMode}
                                isSelected={selectedIds.includes(bookmark.dramaId)}
                                onSelect={toggleSelect}
                                onRemove={() => removeBookmark(bookmark.dramaId)}
                            />
                        ))}
                    </div>
                )}

                {/* Edit Mode Actions */}
                {isEditMode && hasBookmarks && (
                    <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-neutral-900 border-t border-neutral-800">
                        <div className="flex gap-3">
                            <button
                                onClick={selectAll}
                                className="flex-1 px-4 py-2.5 bg-neutral-800 text-white font-bold rounded-full hover:bg-neutral-700 transition-colors"
                            >
                                Pilih Semua
                            </button>
                            <button
                                onClick={deleteSelected}
                                disabled={selectedIds.length === 0}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Hapus ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                )}

                {/* Clear All Button (when not in edit mode) */}
                {!isEditMode && hasBookmarks && (
                    <div className="mt-8 mb-8">
                        <button
                            onClick={clearAll}
                            className="w-full px-4 py-3 border border-red-600/50 text-red-400 font-bold rounded-full hover:bg-red-600/10 transition-colors"
                        >
                            Hapus Semua Bookmark
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
