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
import { MusicNote as MusicNoteIcon } from '@mui/icons-material';

export default function SameYearTracks({ spotifyId, releaseDate }) {
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(null);

  useEffect(() => {
    // Extract the year from the release date
    if (releaseDate) {
      // Handle different date formats (YYYY-MM-DD or YYYY)
      const yearMatch = releaseDate.match(/^\d{4}/);
      if (yearMatch) {
        setYear(yearMatch[0]);
      }
    }
  }, [releaseDate]);

  useEffect(() => {
    const fetchSimilarTracks = async () => {
      if (!spotifyId || !year) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/tracks/spotify/${spotifyId}/similar-year?year=${year}`
        );
        setSimilarTracks(response.data.tracks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch same year tracks:', err);
        setError('无法加载同年发行歌曲');
        setLoading(false);
      }
    };

    if (spotifyId && year) {
      fetchSimilarTracks();
    }
  }, [spotifyId, year]);

  // If no year is available or no similar tracks found (when not loading), don't display the component
  if ((!year && !loading) || (!loading && similarTracks.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          <strong>同年发行 ({year}) 的歌曲:</strong>
        </Typography>
        {loading && <Skeleton width={24} height={24} variant="circular" sx={{ ml: 1 }} />}
        {year && !loading && !error && (
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