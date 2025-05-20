"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Tooltip, 
  AvatarGroup, 
  Avatar, 
  Box, 
  Typography, 
  CircularProgress, 
  Link,
  Chip,
  Skeleton
} from '@mui/material';
import { MusicNote as MusicNoteIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { formatDuration } from 'src/utils/formatDuration'; // Import the duration formatter

export default function SimilarDurationTracks({ spotifyId, durationMs }) {
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fixed range of 30 seconds instead of adjustable slider
  const DURATION_RANGE_SECONDS = 30;

  useEffect(() => {
    const fetchSimilarTracks = async () => {
      if (!spotifyId || !durationMs) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/tracks/spotify/${spotifyId}/similar-duration`, {
            params: {
              duration_ms: durationMs,
              range_seconds: DURATION_RANGE_SECONDS
            }
          }
        );
        setSimilarTracks(response.data.tracks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch similar duration tracks:', err);
        setError('无法加载相似时长歌曲');
        setLoading(false);
      }
    };

    if (spotifyId && durationMs) {
      fetchSimilarTracks();
    }
  }, [spotifyId, durationMs]);

  // If no duration is available or no similar tracks found (when not loading), don't display the component
  if ((!durationMs && !loading) || (!loading && similarTracks.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          <strong>相似时长歌曲:</strong>
        </Typography>
        {loading && <Skeleton width={24} height={24} variant="circular" sx={{ ml: 1 }} />}
        {durationMs && !loading && !error && (
          <Chip 
            size="small" 
            label={`${similarTracks.length}首 (±${DURATION_RANGE_SECONDS}秒)`} 
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
        <AvatarGroup max={12} sx={{ justifyContent: 'flex-start' }}>
          {similarTracks.map((track) => (
            <Tooltip
              key={track.spotify_id}
              title={`${track.name} - ${track.artist_name} (${formatDuration(track.duration_ms)})`}
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