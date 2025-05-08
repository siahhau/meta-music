'use client';
import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import axios from 'axios';

import { Avatar, Button, IconButton, InputBase, InputAdornment, Box } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function CommentInput({ album }) {
  const { user } = useMockedUser();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const handlePostComment = useCallback(async () => {
    if (!message.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/albums/spotify/${album.spotify_id}/comments`,
        {
          content: message,
          user: user.displayName,
          score: 0, // 可扩展为支持评分
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status !== 201) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setMessage('');
      // 触发页面刷新以显示新评论
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }, [message, album, user]);

  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        p: (theme) => theme.spacing(3, 0, 0, 0),
      }}
    >
      <Avatar src={user?.photoURL} alt={user?.displayName}>
        {user?.displayName?.charAt(0).toUpperCase()}
      </Avatar>
      <InputBase
        fullWidth
        value={message}
        onChange={handleChangeMessage}
        placeholder="写下你的评论…"
        endAdornment={
          <InputAdornment position="end" sx={{ mr: 1 }}>
            <IconButton size="small">
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton size="small">
              <Iconify icon="eva:smiling-face-fill" />
            </IconButton>
            <Button variant="contained" onClick={handlePostComment}>
              发布
            </Button>
          </InputAdornment>
        }
        sx={[
          (theme) => ({
            pl: 1.5,
            height: 40,
            borderRadius: 1,
            border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.32)}`,
          }),
        ]}
      />
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
}
