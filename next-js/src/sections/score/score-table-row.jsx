import PropTypes from 'prop-types';

import Link from 'next/link';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ScoreTableRow({ row, selected, onSelectRow, onDeleteRow, detailsHref }) {
  const { id, track_name, user, created_at, status, reward } = row;

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelectRow} />
      </TableCell>

      <TableCell>{id}</TableCell>

      <TableCell>
        <Link href={detailsHref} color="inherit">
          {track_name || '未知歌曲'}
        </Link>
      </TableCell>

      <TableCell>{user || '未知用户'}</TableCell>

      <TableCell>{created_at ? fDate(created_at) : '未知'}</TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (status === 'APPROVED' && 'success') ||
            (status === 'PENDING' && 'warning') ||
            (status === 'REJECTED' && 'error') ||
            'default'
          }
        >
          {status === 'APPROVED' ? '已通过' : status === 'PENDING' ? '待审核' : status === 'REJECTED' ? '已拒绝' : '未知'}
        </Label>
      </TableCell>

      <TableCell>¥{reward ? Number(reward).toFixed(2) : '0.00'}</TableCell>

      <TableCell align="right">
        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <IconButton color="inherit">
            <Link href={detailsHref}>
              <Iconify icon="solar:eye-bold" />
            </Link>
          </IconButton>
          <IconButton color="error" onClick={onDeleteRow}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

ScoreTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  detailsHref: PropTypes.string,
};
