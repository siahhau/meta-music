'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import axiosInstance from 'src/lib/axios';
import { endpoints } from 'src/lib/axios';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { TrackList } from '../track-list';
import { TrackSort } from '../track-sort';
import { TrackSearch } from '../track-search';
import { TrackFilters } from '../track-filters';
import { TrackFiltersResult } from '../track-filters-result';

// ----------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: 'name', label: '歌曲名' },
  { value: 'popularity', label: '流行度' },
  { value: 'created_at', label: '创建时间' },
];

const EXPLICIT_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'true', label: 'Explicit' },
  { value: 'false', label: '非 Explicit' },
];

const ARTIST_OPTIONS = ['All Artists', 'The Weeknd', 'Taylor Swift', 'Drake'];

const PAGE_SIZE_OPTIONS = [
  { value: 12, label: '12 条/页' },
  { value: 24, label: '24 条/页' },
  { value: 48, label: '48 条/页' },
];

export function TrackListView() {
  const openFilters = useBoolean();
  const [sortBy, setSortBy] = useState('name');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);

  const filters = {
    state: {
      explicit: 'all',
      artist: 'All Artists',
    },
    setState: useCallback((newFilters) => {
      filters.state = { ...filters.state, ...newFilters };
      setPage(1);
      fetchTracks();
    }, []),
  };

  const { state: currentFilters } = filters;

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ordering: sortBy === 'name' ? 'name' : sortBy === 'popularity' ? '-popularity' : '-created_at',
        explicit: currentFilters.explicit !== 'all' ? currentFilters.explicit : undefined,
        query: currentFilters.artist !== 'All Artists' ? currentFilters.artist : undefined,
      };
      const response = await axiosInstance.get(endpoints.track.list, { params });
      setTracks(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / pageSize));
      setError(null);
    } catch (err) {
      setError('无法加载歌曲列表，请稍后重试');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, currentFilters.explicit, currentFilters.artist]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const canReset = currentFilters.explicit !== 'all' || currentFilters.artist !== 'All Artists';

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const renderFilters = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-end', sm: 'center' },
      }}
    >
      <TrackSearch redirectPath={(id) => paths.dashboard.track.details(id)} />

      <Box sx={{ gap: 1, flexShrink: 0, display: 'flex' }}>
        <TrackFilters
          filters={filters}
          canReset={canReset}
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          options={{
            explicit: EXPLICIT_OPTIONS.map((option) => option.label),
            artists: ARTIST_OPTIONS,
          }}
        />

        <TrackSort sort={sortBy} onSort={handleSortBy} sortOptions={SORT_OPTIONS} />
      </Box>
    </Box>
  );

  const renderResults = () => (
    <TrackFiltersResult filters={filters} totalResults={tracks.length} />
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="歌曲列表"
        links={[
          { name: '仪表板', href: paths.dashboard.root },
          { name: '歌曲', href: paths.dashboard.track.root },
          { name: '列表' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters()}
        {canReset && renderResults()}
      </Stack>

      {loading && <Box>加载中...</Box>}
      {error && <EmptyContent title={error} filled sx={{ py: 10 }} />}
      {!loading && !error && !tracks.length && <EmptyContent title="无歌曲数据" filled sx={{ py: 10 }} />}

      <TrackList
        tracks={tracks}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </DashboardContent>
  );
}
