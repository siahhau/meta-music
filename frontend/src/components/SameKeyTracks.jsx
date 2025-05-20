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
  Skeleton
} from '@mui/material';
import { 
  MusicNote as MusicNoteIcon,
  Piano as PianoIcon 
} from '@mui/icons-material';
import { Link } from '@mui/material';

export default function SameKeyTracks({ spotifyId, keyName, scaleName }) {
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarTracks = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/tracks/spotify/${spotifyId}/similar-key`
        );
        setSimilarTracks(response.data.tracks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch same key tracks:', err);
        setError('无法加载相同调性歌曲');
        setLoading(false);
      }
    };

    if (spotifyId && keyName && scaleName) {
      fetchSimilarTracks();
    }
  }, [spotifyId, keyName, scaleName]);

  // 如果没有相同调性的歌曲，不显示组件
  if (!loading && similarTracks.length === 0) return null;

  // 将 scaleName 转换为中文显示
  const scaleNameInChinese = scaleName === 'major' ? '大调' : scaleName === 'minor' ? '小调' : scaleName;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
          <PianoIcon fontSize="small" sx={{ mr: 0.5 }} />
          <strong>相同调性 ({keyName} {scaleNameInChinese}) 的歌曲:</strong>
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