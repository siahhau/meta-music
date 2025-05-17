// frontend/src/components/ChordUpload.jsx
'use client';

import { useCallback, useState } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import { UploadBox } from 'src/components/upload/upload-box';
import { Iconify } from './iconify';
export default function ChordUpload({ spotifyId }) {
  const [uploadMessage, setUploadMessage] = useState('');

  // 处理文件拖放
  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) {
        setUploadMessage('未选择文件');
        return;
      }
      if (!file.name.endsWith('.json')) {
        setUploadMessage('文件必须是 JSON 格式');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await axios.post(`http://localhost:8000/tracks/spotify/${spotifyId}/upload-chords`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.status === 200) {
          setUploadMessage('上传成功！调性和和弦已更新');
          // 刷新页面以显示更新
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (err) {
        setUploadMessage(`上传失败：${err.response?.data?.error || err.message}`);
      }
    },
    [spotifyId]
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        上传乐谱
      </Typography>
      <UploadBox
        onDrop={handleDrop}
        placeholder={
          <Box
            sx={{
              gap: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.disabled',
              flexDirection: 'column',
            }}
          >
            <Iconify icon="eva:cloud-upload-fill" width={40} />
            <Typography variant="body2">拖放或点击上传 JSON 文件</Typography>
          </Box>
        }
        sx={{
          py: 2.5,
          width: 'auto',
          height: 'auto',
          borderRadius: 1.5,
        }}
        accept={{ 'application/json': ['.json'] }}
      />
      {uploadMessage && (
        <Typography
          variant="body2"
          sx={{ mt: 1, color: uploadMessage.includes('失败') ? 'error.main' : 'success.main' }}
        >
          {uploadMessage}
        </Typography>
      )}
    </Box>
  );
}