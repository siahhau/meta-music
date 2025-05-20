"use client";
import React from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import PianoRollVisualizer from './PianoRollVisualizer';
import { useGetScoreData, validateScoreData } from '../actions/score'; // Adjust path as needed

const ScorePianoRoll = ({
  spotifyId,
  title = "乐谱可视化",
  width = 960,
  height = 580
}) => {
  const { 
    scoreData, 
    scoreLoading, 
    scoreError 
  } = useGetScoreData(spotifyId);

  // Render function
  const renderContent = () => {
    if (scoreLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (scoreError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {scoreError.message || "获取乐谱数据失败"}
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

        {/* 调试信息区域 */}
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