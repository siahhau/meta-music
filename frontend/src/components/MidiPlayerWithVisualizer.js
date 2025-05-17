"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Divider } from '@mui/material';
import MidiPlayer from './MidiPlayer';
import MidiVisualizer from './MidiVisualizer';

const MidiPlayerWithVisualizer = ({ 
  src, 
  title = "MIDI 播放器与可视化",
  defaultVisualizerType = 'piano-roll',
  height = 300,
  showControls = true,
  autoFollow = true // 添加自动跟随选项
}) => {
  const [loop, setLoop] = useState(false);
  const [useSoundFont, setUseSoundFont] = useState(true);
  const [followActiveNotes, setFollowActiveNotes] = useState(autoFollow);
  const [events, setEvents] = useState([]);
  const [clientSide, setClientSide] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  
  const visualizerRef = useRef(null);
  
  // 确保只在客户端渲染
  useEffect(() => {
    setClientSide(true);
  }, []);
  
  // 处理事件
  const addEvent = (type) => {
    return (event) => {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // 记录音符事件，更新当前音符
      if (type === 'note' && event?.detail?.note) {
        setCurrentNote(event.detail.note);
      }
      
      // 只在开发环境记录事件
      if (process.env.NODE_ENV === 'development') {
        console.log(`MIDI Event [${timeString}] ${type}`, event?.detail);
      }
      
      setEvents(prev => [
        { time: timeString, type, detail: event?.detail ? JSON.stringify(event.detail).substring(0, 50) : '' },
        ...prev.slice(0, 9)  // 只保留最近的10个事件
      ]);
    };
  };
  
  // 处理跟随开关变更
  const handleFollowChange = (event) => {
    setFollowActiveNotes(event.target.checked);
  };
  
  // 如果是服务器端，返回占位组件
  if (!clientSide) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">MIDI播放器加载中...</Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      {showControls && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch 
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)} 
                size="small"
              />
            }
            label="循环播放"
            sx={{ mr: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={useSoundFont}
                onChange={(e) => setUseSoundFont(e.target.checked)} 
                size="small"
              />
            }
            label="使用SoundFont (更好的音质)"
            sx={{ mr: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={followActiveNotes}
                onChange={handleFollowChange} 
                size="small"
              />
            }
            label="自动跟随当前播放位置"
          />
        </Box>
      )}
      
      <Box sx={{ mb: 2 }}>
        <MidiPlayer
          src={src}
          soundFont={useSoundFont ? '' : null}
          loop={loop}
          visualizer={visualizerRef.current}
          onLoad={addEvent('load')}
          onStart={addEvent('start')}
          onStop={addEvent('stop')}
          onLoop={addEvent('loop')}
          onNote={addEvent('note')}
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <MidiVisualizer
        ref={visualizerRef}
        src={src}
        type={defaultVisualizerType}
        height={height}
        followActiveNotes={followActiveNotes}
        config={
          defaultVisualizerType === 'waterfall' 
            ? { 
                showOnlyOctavesUsed: true,
                activeNoteRGB: '255, 0, 0', // 红色活动音符
                noteRGB: '64, 128, 255' // 蓝色普通音符
              } 
            : {
                activeNoteRGB: '255, 0, 0', // 红色活动音符
                noteRGB: '64, 128, 255' // 蓝色普通音符
              }
        }
      />
      
      {/* 显示当前音符信息（可选） */}
      {currentNote && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="primary">
            当前音符: {getNoteNameFromMidiNumber(currentNote.pitch)} (MIDI音高: {currentNote.pitch}, 力度: {currentNote.velocity})
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// 辅助函数：将MIDI音符编号转换为音符名称
function getNoteNameFromMidiNumber(midiNumber) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = noteNames[midiNumber % 12];
  return `${noteName}${octave}`;
}

export default MidiPlayerWithVisualizer;