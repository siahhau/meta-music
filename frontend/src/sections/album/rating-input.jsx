'use client';
import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import axios from 'axios';

import { Card, Box, Typography, Rating, InputBase, Fab, Button } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function RatingInput({ album }) {
  const { user } = useMockedUser();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [error, setError] = useState(null);

  const handleChangeReview = useCallback((event) => {
    setReview(event.target.value);
  }, []);

  const handlePostRating = useCallback(async () => {
    if (rating === 0 && !review.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/albums/spotify/${album.spotify_id}/ratings`,
        {
          score: rating,
          review: review,
          user: user.displayName,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status !== 201) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setRating(0);
      setReview('');
    } catch (err) {
      setError(err.message);
    }
  }, [rating, review, album, user]);

  return (
    <Card sx={{ p: 3 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          错误: {error}
        </Typography>
      )}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            gap: 1,
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            mb: 2,
          }}
        >
          <Typography variant="subtitle2">评分：</Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            precision={1}
            size="medium"
          />
        </Box>
        <InputBase
          multiline
          fullWidth
          rows={4}
          value={review}
          onChange={handleChangeReview}
          placeholder="写下你的乐评..."
          sx={[
            (theme) => ({
              p: 2,
              borderRadius: 1,
              border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
            }),
          ]}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            gap: 1,
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
          }}
        >
          <Fab size="small" color="inherit" variant="softExtended">
            <Iconify icon="solar:gallery-wide-bold" width={24} sx={{ color: 'success.main' }} />
            图片/视频
          </Fab>
        </Box>
        <Button variant="contained" onClick={handlePostRating}>
          提交评分和评测
        </Button>
      </Box>
    </Card>
  );
}
