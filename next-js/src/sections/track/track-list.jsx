import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Pagination, { paginationClasses } from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';

import { paths } from 'src/routes/paths';
import { TrackItem } from './track-item';

// ----------------------------------------------------------------------

function getPaginationRange(currentPage, totalPages, maxVisible = 5) {
  const delta = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - delta);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);

  return pages;
}

export function TrackList({ tracks, totalPages, page, onPageChange, pageSize, onPageSizeChange, pageSizeOptions }) {
  return (
    <>
      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {tracks.map((track) => (
          <TrackItem
            key={track.spotify_id}
            track={track}
            detailshref={paths.dashboard.track.details(track.spotify_id)}
          />
        ))}
      </Box>

      {totalPages > 1 && (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: { xs: 8, md: 8 } }}>
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => onPageChange(value)}
            renderItem={(item) => {
              const pages = getPaginationRange(page, totalPages);
              if (!pages.includes(item.page) && item.type === 'page') return null;
              if (item.type === 'page' && (item.page === '...' || typeof item.page === 'string')) {
                return <PaginationItem {...item} page="…" disabled />;
              }
              return <PaginationItem {...item} />;
            }}
            sx={{
              [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
            }}
          />
        </Stack>
      )}
    </>
  );
}
