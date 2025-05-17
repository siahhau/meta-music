"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

// 动态导入乐谱可视化组件
const ScorePianoRoll = dynamic(
  () => import('src/components/ScorePianoRoll'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          乐谱可视化器加载中...
        </Typography>
      </Box>
    )
  }
);

// 客户端包装器
const ScorePianoRollWrapper = ({ spotifyId, title, width, height }) => {
  return (
    <ScorePianoRoll
      spotifyId={spotifyId} 
      title={title}
      width={width} 
      height={height}
    />
  );
};

export default ScorePianoRollWrapper;