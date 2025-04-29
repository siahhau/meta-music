import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ScoreTableToolbar({ filters, onResetPage }) {
  const { state: currentFilters, setState: updateFilters } = filters;

  return (
    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        fullWidth
        value={currentFilters.name}
        onChange={(event) => {
          updateFilters({ name: event.target.value });
          onResetPage();
        }}
        placeholder="搜索歌曲名称..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        value={currentFilters.status}
        onChange={(event) => {
          updateFilters({ status: event.target.value });
          onResetPage();
        }}
        SelectProps={{ native: true }}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      >
        {[
          { value: 'all', label: '全部' },
          { value: 'PENDING', label: '待审核' },
          { value: 'APPROVED', label: '已通过' },
          { value: 'REJECTED', label: '已拒绝' },
        ].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>
    </Box>
  );
}

ScoreTableToolbar.propTypes = {
  filters: PropTypes.object.isRequired,
  onResetPage: PropTypes.func.isRequired,
};
