"use client"
// src/components/SimilarStructureSongs.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip, AvatarGroup, Avatar, Box, Typography, CircularProgress } from '@mui/material';
import { MusicNote as MusicNoteIcon } from '@mui/icons-material';
import { Link } from '@mui/material';

export default function SimilarStructureSongs({ spotifyId }) {
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
        setError('无法加载相似结构歌曲');
        setLoading(false);
      }
    };

    if (spotifyId) {
      fetchSimilarTracks();
    }
  }, [spotifyId]);

  // 如果没有相似结构的歌曲，不显示组件
  if (!loading && similarTracks.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>相同结构的歌曲:</strong>
      </Typography>
      
      {loading ? (
        <CircularProgress size={24} sx={{ ml: 1 }} />
      ) : error ? (
        <Typography color="error" variant="body2">{error}</Typography>
      ) : (
        <AvatarGroup max={8} sx={{ justifyContent: 'flex-start' }}>
          {similarTracks.map((track) => (
            <Tooltip key={track.spotify_id} title={track.name} arrow>
              <Avatar 
                alt={track.name} 
                src={track.image_url} 
                component={Link}
                to={`/dashboard/track/${track.spotify_id}`}
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