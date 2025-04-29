'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import axiosInstance from 'src/lib/axios';
import { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { TrackDetailsToolbar } from '../track-details-toolbar';
import { TrackDetailsContent } from '../track-details-content';

// ----------------------------------------------------------------------

export function TrackDetailsView({ initialTrackData, error: initialError }) {
  const params = useParams();
  const spotify_id = params.id; // 使用 params.id
  const [trackData, setTrackData] = useState(initialTrackData);
  const [loading, setLoading] = useState(!initialTrackData && !initialError);
  const [error, setError] = useState(initialError);

  const fetchTrack = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(endpoints.track.details.replace(':spotify_id', spotify_id));
      setTrackData(response.data);
      setError(null);
    } catch (err) {
      console.error('获取歌曲详情失败:', {
        spotify_id,
        status: err.response?.status,
        message: err.response?.data?.error || err.message,
      });
      let errorMsg = '无法加载歌曲详情，请稍后重试';
      if (err.response?.status === 401) {
        errorMsg = '未授权，请登录后重试';
      } else if (err.response?.status === 404) {
        errorMsg = '歌曲不存在或不可用';
      } else if (err.response?.status === 400) {
        errorMsg = '无效的歌曲 ID';
      }
      setError(err.response?.data?.error || errorMsg);
      setTrackData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTrackData && !initialError && spotify_id) {
      fetchTrack();
    }
  }, [spotify_id, initialTrackData, initialError]);

  if (loading) {
    return (
      <DashboardContent>
        <Typography>加载中...</Typography>
      </DashboardContent>
    );
  }

  if (error || !trackData) {
    return (
      <DashboardContent>
        <Typography color="error" sx={{ mb: 2 }}>
          {error || '歌曲未找到'}
        </Typography>
        <Button variant="contained" onClick={fetchTrack}>
          重试
        </Button>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <TrackDetailsToolbar backHref={paths.dashboard.track.list || '/dashboard/track'} />
      <TrackDetailsContent track={trackData.track} />
    </DashboardContent>
  );
}
