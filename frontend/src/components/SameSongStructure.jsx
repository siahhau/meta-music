"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Tooltip, 
  AvatarGroup, 
  Avatar, 
  Box, 
  Typography, 
  Chip,
  Skeleton,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import { 
  MusicNote as MusicNoteIcon,
  ViewWeek as ViewWeekIcon
} from '@mui/icons-material';
import { Link } from '@mui/material';

export default function SameSongStructure({ spotifyId, sections = [] }) {
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarTracks = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/tracks/spotify/${spotifyId}/similar-structure`
        );
        setSimilarTracks(response.data.tracks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch similar structure tracks:', err);
        setError('无法加载相同结构歌曲');
        setLoading(false);
      }
    };

    if (spotifyId) {
      fetchSimilarTracks();
    }
  }, [spotifyId]);

  // 如果没有提供sections或没有相似结构的歌曲，不显示组件
  if ((!sections || sections.length === 0) && !loading) return null;
  if (!loading && similarTracks.length === 0) return null;

  // 格式化歌曲结构为易读字符串
  const structureFormatted = sections && sections.length > 0 
    ? sections.join(' → ') 
    : '未知结构';

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
          <ViewWeekIcon fontSize="small" sx={{ mr: 0.5 }} />
          <strong>相同结构的歌曲:</strong>
        </Typography>
        {loading && <Skeleton width={24} height={24} variant="circular" sx={{ ml: 1 }} />}
        {!loading && !error && (
          <Chip 
            size="small" 
            label={`${similarTracks.length}首`} 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 1 }}
          />
        )}
      </Box>
      
      {/* 展示当前结构 */}
      {sections && sections.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1, mb: 2, maxWidth: 'fit-content' }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {sections.map((section, index) => (
              <React.Fragment key={`section-${index}`}>
                <Chip 
                  label={section} 
                  size="small" 
                  variant="filled"
                  color={
                    section.toLowerCase().includes('verse') ? 'info' :
                    section.toLowerCase().includes('chorus') ? 'primary' :
                    section.toLowerCase().includes('intro') ? 'success' :
                    section.toLowerCase().includes('outro') ? 'warning' :
                    section.toLowerCase().includes('bridge') ? 'secondary' :
                    'default'
                  }
                />
                {index < sections.length - 1 && (
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    →
                  </Typography>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="circular" width={40} height={40} />
          ))}
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2">{error}</Typography>
      ) : (
        <AvatarGroup max={8} sx={{ justifyContent: 'flex-start' }}>
          {similarTracks.map((track) => (
            <Tooltip
              key={track.spotify_id}
              title={`${track.name} - ${track.artist_name}`}
              arrow
            >
              <Avatar
                alt={track.name}
                src={track.image_url}
                component={Link}
                href={`/dashboard/track/${track.spotify_id}`}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 10px 0 rgba(0,0,0,0.2)',
                    transform: 'scale(1.1)',
                    transition: 'all 0.3s ease',
                  }
                }}
              >
                {!track.image_url && <MusicNoteIcon />}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}
    </Box>
  );
}