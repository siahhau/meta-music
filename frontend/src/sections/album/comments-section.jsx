'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Box, Typography, Stack, CardHeader, Skeleton } from '@mui/material';
import { CommentInput } from 'src/sections/album/comment-input';
import { ProfilePostItem } from 'src/sections/album/profile-post-item';

// ----------------------------------------------------------------------

export default function CommentsSection({ album }) {
  const [comments, setComments] = useState({ count: 0, items: [] });
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

    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:8000/albums/spotify/${album.spotify_id}/comments`,
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
          setComments(response.data || { count: 0, items: [] });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || '无法加载评论');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComments();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [album]);

  return (
    <Card sx={{ p: 3 }}>
      <CardHeader
        title={
          loading ? (
            <Skeleton width={100} />
          ) : (
            `评论 (${comments.count})`
          )
        }
      />
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} />
            ))}
          </Stack>
        ) : error ? (
          <Typography color="error">错误: {error}</Typography>
        ) : comments.items.length === 0 ? (
          <Typography>暂无评论</Typography>
        ) : (
          <Stack spacing={3}>
            {comments.items.map((comment) => (
              <ProfilePostItem
                key={comment.id}
                post={{
                  id: comment.id,
                  message: comment.content || '',
                  createdAt: comment.created_at || '',
                  comments: [],
                  personLikes: [],
                  media: '',
                  score: comment.score || 0,
                }}
              />
            ))}
          </Stack>
        )}
        {loading ? (
          <Skeleton variant="rectangular" height={40} sx={{ mt: 3 }} />
        ) : (
          <CommentInput album={album} />
        )}
      </Box>
    </Card>
  );
}
