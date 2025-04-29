import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TrackDetailsToolbar({ backHref, sx, ...other }) {
  return (
    <Box
      sx={[{ mb: 3, gap: 1.5, display: 'flex' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Button
        component={RouterLink}
        href={backHref}
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
      >
        返回
      </Button>
    </Box>
  );
}
