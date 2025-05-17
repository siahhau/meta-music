"use client"; // 标记为客户端组件

import React from 'react';
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

// 在客户端组件中使用dynamic import
const MidiPlayerWithVisualizer = dynamic(
  () => import('./MidiPlayerWithVisualizer'),
  { 
    ssr: false, 
    loading: () => (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          MIDI播放器加载中...
        </Typography>
      </Box>
    ) 
  }
);

// 客户端包装组件
const MidiPlayerClient = ({ 
  src, 
  title = "MIDI 播放器与可视化",
  defaultVisualizerType = 'piano-roll',
  height = 300,
  showControls = true,
  autoFollow = true // 添加自动跟随选项
}) => {
  return (
    <MidiPlayerWithVisualizer 
      src={src}
      title={title}
      defaultVisualizerType={defaultVisualizerType}
      height={height}
      showControls={showControls}
      autoFollow={autoFollow}
    />
  );
};

export default MidiPlayerClient;