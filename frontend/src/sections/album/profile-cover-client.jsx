'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Rating, Skeleton } from '@mui/material';
import { ProfileCover } from 'src/sections/user/profile-cover';

// ----------------------------------------------------------------------

export function ProfileCoverClient({ role, name, coverUrl, avatarUrl }) {
  const [averageRating, setAverageRating] = useState({ average_rating: 0, rating_count: 0 });
  const [loading, setLoading] = useState(true);

  // 获取平均评分
  useEffect(() => {
    const fetchAverageRating = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/albums/spotify/${avatarUrl.split('/').pop()}/average-rating`,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );
        if (response.status !== 200) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setAverageRating(response.data || { average_rating: 0, rating_count: 0 });
      } catch (err) {
        // 404 或其他错误时，默认显示空评分
        setAverageRating({ average_rating: 0, rating_count: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchAverageRating();
  }, [avatarUrl]);

  return (
    <ProfileCover
      role={role}
      name={name} // 传递字符串 name
      coverUrl={coverUrl}
      avatarUrl={avatarUrl}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 1, ml: 2, mt: 4 }}>
        <Typography variant="h4">{name}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {role}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={120} height={24} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating
              value={averageRating.average_rating}
              readOnly
              precision={0.1}
              size="small"
            />
            <Typography variant="body2">
              ({averageRating.rating_count} 次评分)
            </Typography>
          </Box>
        )}
      </Box>
    </ProfileCover>
  );
}
