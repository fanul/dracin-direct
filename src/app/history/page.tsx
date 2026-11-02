'use client';

import PageHeader from '../components/layout/PageHeader';
import { HistoryGroup } from '../components/pages/HistoryGroup';
import { EmptyHistory } from '../components/pages/EmptyHistory';
import { useHistory } from '../../hooks/useHistory';

export default function HistoryPage() {
    const {
        history,
        loading,
        error,
        isEditMode,
        selectedIds,
        toggleEditMode,
        toggleSelect,
        selectAll,
        deleteSelected,
        clearAll,
        totalCount,
    } = useHistory();

    const hasHistory = totalCount > 0;

    return (
        <main className="min-h-screen bg-neutral-950 pb-24">
            {/* Header */}
            <PageHeader
                title="Riwayat Tontonan"
                action={
                    hasHistory && (
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
            <div className="pt-16">
                {/* Error */}
                {error && (
                    <div className="mx-4 mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-center">
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
                {!loading && !hasHistory && <EmptyHistory />}

                {/* History Groups */}
                {!loading && hasHistory && (
                    <>
                        <HistoryGroup
                            title="Hari Ini"
                            items={history.today}
                            isEditMode={isEditMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                        <HistoryGroup
                            title="Kemarin"
                            items={history.yesterday}
                            isEditMode={isEditMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                        <HistoryGroup
                            title="Minggu Lalu"
                            items={history.lastWeek}
                            isEditMode={isEditMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                        <HistoryGroup
                            title="Bulan Lalu"
                            items={history.lastMonth}
                            isEditMode={isEditMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                        <HistoryGroup
                            title="Lebih Lama"
                            items={history.older}
                            isEditMode={isEditMode}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />
                    </>
                )}

                {/* Edit Mode Actions */}
                {isEditMode && hasHistory && (
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
                {!isEditMode && hasHistory && (
                    <div className="px-4 mt-8 mb-8">
                        <button
                            onClick={clearAll}
                            className="w-full px-4 py-3 border border-red-600/50 text-red-400 font-bold rounded-full hover:bg-red-600/10 transition-colors"
                        >
                            Hapus Semua Riwayat
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
