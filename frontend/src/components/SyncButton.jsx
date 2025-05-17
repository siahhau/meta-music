// frontend/src/components/SyncButton.jsx
'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SyncButton({ spotifyId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`http://localhost:8000/albums/spotify/${spotifyId}/sync`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      if (response.status === 200) {
        router.refresh();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSync}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        size="small"
      >
        {loading ? '同步中...' : '同步专辑数据'}
      </Button>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          同步失败：{error}
        </Typography>
      )}
    </Box>
  );
}