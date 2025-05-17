"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

// 在客户端组件中使用dynamic import
const MidiUploadWrapper = dynamic(
  () => import('src/components/MidiUploadWrapper'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          MIDI上传组件加载中...
        </Typography>
      </Box>
    )
  }
);

// 客户端包装组件
const ClientComponentsWrapper = ({ spotifyId, midiUrl, trackName }) => {
  // 构建完整的MIDI URL (如果存在)
  let fullMidiUrl = null;
  if (midiUrl) {
    // 确保URL是完整的URL
    if (midiUrl.startsWith('http')) {
      fullMidiUrl = midiUrl;
    } else {
      // 相对URL，添加API基础路径
      fullMidiUrl = `http://localhost:8000${midiUrl}`;
    }
  }

  // 动态导入MidiPlayerClient
  const MidiPlayerClient = dynamic(
    () => import('src/components/MidiPlayerClient'),
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

  return (
    <>
      {/* MIDI播放器和可视化器 */}
      {fullMidiUrl ? (
        <MidiPlayerClient
          src={fullMidiUrl}
          title={`"${trackName}" 的MIDI播放与可视化`}
          height={350}
          autoFollow={true}
        />
      ) : (
        <Box sx={{ mb: 3, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            MIDI播放
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            该歌曲尚未上传MIDI文件。如果您有此歌曲的MIDI文件，可以上传后使用播放器试听。
          </Typography>
        </Box>
      )}
      
      {/* MIDI上传组件 */}
      <MidiUploadWrapper 
        spotifyId={spotifyId}
        apiBaseUrl="http://localhost:8000"
      />
    </>
  );
};

export default ClientComponentsWrapper;