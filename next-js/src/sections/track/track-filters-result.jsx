import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function TrackFiltersResult({ filters, totalResults, sx }) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveExplicit = useCallback(() => {
    updateFilters({ explicit: 'all' });
  }, [updateFilters]);

  const handleRemoveArtist = useCallback(() => {
    updateFilters({ artist: 'All Artists' });
  }, [updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label="Explicit:" isShow={currentFilters.explicit !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.explicit === 'true' ? 'Explicit' : '非 Explicit'}
          onDelete={handleRemoveExplicit}
        />
      </FiltersBlock>

      <FiltersBlock label="艺术家:" isShow={currentFilters.artist !== 'All Artists'}>
        <Chip {...chipProps} label={currentFilters.artist} onDelete={handleRemoveArtist} />
      </FiltersBlock>
    </FiltersResult>
  );
}
