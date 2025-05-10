'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { varAlpha } from 'minimal-shared/utils';
import { Box, Card, Stack, Avatar, Typography, CardHeader, Skeleton, Rating } from '@mui/material';
import { fDate } from 'src/utils/format-time';
import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function RatingsSection({ album }) {
  const { user } = useMockedUser();
  const [ratings, setRatings] = useState({ count: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!album?.spotify_id) {
      setError('专辑 ID 缺失');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:8000/albums/spotify/${album.spotify_id}/ratings`,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000, // 设置 10 秒超时
            signal: controller.signal,
          }
        );
        if (response.status !== 200) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        if (isMounted) {
          setRatings(response.data || { count: 0, items: [] });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || '无法加载评测');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRatings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [album]);

  const renderRatingItem = (rating) => (
    <Box sx={{ gap: 2, display: 'flex' }}>
      <Avatar
        src={rating.user_photo || user?.photoURL}
        alt={rating.user || user?.displayName}
        sx={{ width: 40, height: 40 }}
      >
        {(rating.user || user?.displayName)?.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            mb: 0.5,
            display: 'flex',
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Typography variant="subtitle2">{rating.user || user?.displayName}</Typography>
          <Typography variant="caption" color="text.disabled">
            {fDate(rating.created_at || new Date())}
          </Typography>
        </Box>
        <Rating value={rating.score || 0} readOnly size="small" precision={0.5} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {rating.review || '无评测内容'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader
        title={
          loading ? (
            <Skeleton width={100} />
          ) : (
            `评测 (${ratings.count})`
          )
        }
      />
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} />
            ))}
          </Stack>
        ) : error ? (
          <Typography color="error">错误: {error}</Typography>
        ) : ratings.items.length === 0 ? (
          <Typography>暂无评测</Typography>
        ) : (
          <Stack spacing={2}>
            {ratings.items.map((rating) => (
              <Box key={rating.id}>{renderRatingItem(rating)}</Box>
            ))}
          </Stack>
        )}
      </Box>
    </Card>
  );
}
