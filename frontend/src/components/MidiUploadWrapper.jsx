"use client";

import React from 'react';
import MidiUpload from 'src/components/MidiUpload';

const MidiUploadWrapper = ({ spotifyId, apiBaseUrl }) => {
  // 在客户端组件内部定义事件处理函数
  const handleSuccess = (data) => {
    console.log('MIDI上传成功:', data);
    // 页面刷新以显示新上传的MIDI
    window.location.reload();
  };

  const handleDelete = () => {
    console.log('MIDI已删除');
    // 页面刷新以更新状态
    window.location.reload();
  };

  return (
    <MidiUpload
      spotifyId={spotifyId}
      onSuccess={handleSuccess}
      onDelete={handleDelete}
      apiBaseUrl={apiBaseUrl}
    />
  );
};

export default MidiUploadWrapper;