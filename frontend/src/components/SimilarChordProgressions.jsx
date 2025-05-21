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
  Stack
} from '@mui/material';
import { 
  MusicNote as MusicNoteIcon,
  Piano as ChordIcon
} from '@mui/icons-material';
import { Link } from '@mui/material';

export default function SimilarChordProgressions({ spotifyId, chords = [] }) {
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chordsList, setChordsList] = useState([]);

  useEffect(() => {
    // 处理传入的和弦数据 - 主要处理数组格式
    if (Array.isArray(chords) && chords.length > 0) {
      setChordsList(chords);
    } else if (typeof chords === 'string') {
      try {
        // 尝试解析JSON字符串
        const parsedChords = JSON.parse(chords);
        if (Array.isArray(parsedChords)) {
          setChordsList(parsedChords);
        } else {
          // 如果是其他JSON格式，以逗号分隔
          setChordsList(chords.split(',').map(c => c.trim()));
        }
      } catch (e) {
        // 如果不是有效的JSON，以逗号分隔
        setChordsList(chords.split(',').map(c => c.trim()));
      }
    }
  }, [chords]);

  useEffect(() => {
    const fetchSimilarTracks = async () => {
      if (!spotifyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/tracks/spotify/${spotifyId}/similar-chords`
        );
        setSimilarTracks(response.data.tracks || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch similar chord tracks:', err);
        setError('无法加载相似和弦歌曲');
        setLoading(false);
      }
    };

    if (spotifyId) {
      fetchSimilarTracks();
    }
  }, [spotifyId]);

  // 如果没有和弦数据或相似歌曲，不显示组件
  if ((!loading && chordsList.length === 0) || 
      (!loading && similarTracks.length === 0)) {
    return null;
  }

  // 为每个和弦分配颜色
  const getChordColor = (chord) => {
    const majorChords = {
      'C': 'primary',
      'G': 'secondary',
      'D': 'success',
      'A': 'info',
      'E': 'warning',
      'B': 'error',
      'F#': 'secondary',
      'C#': 'info',
      'F': 'success',
      'Bb': 'warning',
      'Eb': 'error',
      'Ab': 'primary'
    };
    
    return majorChords[chord] || 'default';
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
          <ChordIcon fontSize="small" sx={{ mr: 0.5 }} />
          <strong>相似和弦的歌曲:</strong>
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
      
      {/* 显示当前和弦 */}
      {chordsList.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {chordsList.map((chord, index) => (
              <React.Fragment key={`chord-${index}`}>
                <Chip 
                  label={chord} 
                  size="small"
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 'medium'
                  }}
                  color={getChordColor(chord)}
                />
                {index < chordsList.length - 1 && index < 7 && (
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    →
                  </Typography>
                )}
                {/* 最多显示8个和弦 */}
                {index === 7 && index < chordsList.length - 1 && (
                  <Chip 
                    label={`+${chordsList.length - 8}个`}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                )}
                {/* 如果有超过8个和弦，只显示前8个 */}
                {index >= 8 && (
                  <React.Fragment></React.Fragment>
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