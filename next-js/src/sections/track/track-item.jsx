'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function TrackItem({ track, sx, ...other }) {
  const placeholderImage = '/assets/placeholder.png'; // 替换为实际占位图路径

  return (
    <Card sx={sx} {...other}>
      <Box sx={{ p: 3, pb: 2 }}>
        <img
          src={track.image_url || placeholderImage}
          alt={track.name}
          style={{
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 8,
            marginBottom: 16,
          }}
        />
        <ListItemText
          sx={{ mb: 1 }}
          primary={
            <Link component={RouterLink} href={paths.dashboard.track.details(track.spotify_id)} color="inherit">
              {track.name}
            </Link>
          }
          secondary={`艺术家: ${track.artist_name}`}
          slotProps={{
            primary: { sx: { typography: 'subtitle1' } },
            secondary: { sx: { mt: 1, typography: 'caption', color: 'text.disabled' } },
          }}
        />
        <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center', color: 'primary.main', typography: 'caption' }}>
          <Iconify width={16} icon="solar:calendar-date-bold" />
          创建时间: {fDate(track.created_at)}
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 3, rowGap: 1.5, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {[
          { label: track.album_name || '未知', icon: <Iconify width={16} icon="solar:album-bold" /> },
          { label: track.popularity || 0, icon: <Iconify width={16} icon="solar:star-bold" /> },
        ].map((item) => (
          <Box key={item.label} sx={{ gap: 0.5, display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
            {item.icon}
            <Typography variant="caption" noWrap>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
