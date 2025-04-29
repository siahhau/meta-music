import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ScoreTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveName = () => {
    updateFilters({ name: '' });
    onResetPage();
  };

  const handleRemoveStatus = () => {
    updateFilters({ status: 'all' });
    onResetPage();
  };

  return (
    <Box sx={{ ...sx }}>
      <Stack flexWrap="wrap" direction="row" alignItems="center" sx={{ p: 2, pb: 0 }}>
        {!!currentFilters.name && (
          <Chip
            size="small"
            label={currentFilters.name}
            onDelete={handleRemoveName}
            sx={{ m: 0.5 }}
          />
        )}

        {currentFilters.status !== 'all' && (
          <Chip
            size="small"
            label={
              currentFilters.status === 'PENDING'
                ? '待审核'
                : currentFilters.status === 'APPROVED'
                ? '已通过'
                : '已拒绝'
            }
            onDelete={handleRemoveStatus}
            sx={{ m: 0.5 }}
          />
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          共 {totalResults} 条结果
        </Typography>

        <Button
          color="inherit"
          onClick={() => {
            updateFilters({ name: '', status: 'all' });
            onResetPage();
          }}
          startIcon={<Iconify icon="eva:trash-2-outline" />}
          sx={{ ml: 2 }}
        >
          清除
        </Button>
      </Stack>
    </Box>
  );
}

ScoreTableFiltersResult.propTypes = {
  filters: PropTypes.object.isRequired,
  totalResults: PropTypes.number.isRequired,
  onResetPage: PropTypes.func.isRequired,
  sx: PropTypes.object,
};
