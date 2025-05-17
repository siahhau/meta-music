"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import PianoRollVisualizer from './PianoRollVisualizer';

// 集成版本的钢琴卷帘可视化组件 - 直接从API获取JSON数据
const ScorePianoRoll = ({ 
  spotifyId,
  title = "乐谱可视化",
  width = 960,
  height = 580
}) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从API获取乐谱数据
  useEffect(() => {
    const fetchScore = async () => {
      if (!spotifyId) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:8000/tracks/spotify/${spotifyId}/scores`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        setScoreData(res.data.score_data || {});
        setLoading(false);
      } catch (err) {
        console.error("获取乐谱数据失败:", err);
        setError(err.message || "获取乐谱数据失败");
        setLoading(false);
      }
    };
    
    setLoading(true);
    setError(null);
    fetchScore();
  }, [spotifyId]);

  // 验证JSON数据完整性
  const validateScoreData = (data) => {
    if (!data) return false;
    
    // 检查必要的字段是否存在
    const requiredFields = ['notes', 'tempos', 'meters'];
    for (const field of requiredFields) {
      if (!data[field] || !Array.isArray(data[field]) || data[field].length === 0) {
        console.warn(`乐谱数据缺少必要字段: ${field}`);
        return false;
      }
    }
    
    return true;
  };

  // 渲染函数
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!scoreData || !validateScoreData(scoreData)) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          这首歌曲暂无可视化乐谱数据
        </Alert>
      );
    }

    return (
      <PianoRollVisualizer 
        data={scoreData} 
        width={width} 
        height={height}
        pixelsPerBeat={50}
        noteHeight={15}
        showChords={true}
        showSections={true}
        autoScroll={true}
        showNoteNames={true}
      />
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        {renderContent()}
        
        {/* 添加一个简单的调试信息区域 */}
        {process.env.NODE_ENV === 'development' && scoreData && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.75rem', color: 'text.secondary', maxHeight: 150, overflow: 'auto' }}>
            <Typography variant="caption" component="div">
              <strong>调式:</strong> {scoreData.keys && scoreData.keys[0] ? `${scoreData.keys[0].tonic} ${scoreData.keys[0].scale}` : '未知'}
              {' | '}
              <strong>速度:</strong> {scoreData.tempos && scoreData.tempos[0] ? `${scoreData.tempos[0].bpm} BPM` : '未知'}
              {' | '}
              <strong>拍号:</strong> {scoreData.meters && scoreData.meters[0] ? `${scoreData.meters[0].numBeats}/${scoreData.meters[0].beatUnit}` : '未知'}
              {' | '}
              <strong>音符数:</strong> {scoreData.notes ? scoreData.notes.length : 0}
              {' | '}
              <strong>和弦数:</strong> {scoreData.chords ? scoreData.chords.length : 0}
              {' | '}
              <strong>段落数:</strong> {scoreData.sections ? scoreData.sections.length : 0}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ScorePianoRoll;