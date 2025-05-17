"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Button, Slider, Typography, CircularProgress, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { waitForMagenta } from '../utils/magenta'; // 使用之前的magenta工具函数

// 默认SoundFont URL
const DEFAULT_SOUNDFONT = 'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus';

// 用于全局跟踪当前播放的播放器
let playingPlayer = null;

// 格式化时间为 mm:ss 格式
const formatTime = (seconds) => {
  const negative = (seconds < 0);
  seconds = Math.floor(Math.abs(seconds || 0));
  const s = seconds % 60;
  const m = Math.floor((seconds - s) / 60);
  const h = Math.floor((seconds - s - 60 * m) / 3600);
  const sStr = (s > 9) ? `${s}` : `0${s}`;
  const mStr = (m > 9 || !h) ? `${m}:` : `0${m}:`;
  const hStr = h ? `${h}:` : '';
  return (negative ? '-' : '') + hStr + mStr + sStr;
};

const MidiPlayer = forwardRef(({ 
  src, 
  soundFont = DEFAULT_SOUNDFONT, 
  loop = false,
  visualizer = null,
  onLoad,
  onStart,
  onStop,
  onLoop,
  onNote
}, ref) => {
  const [ns, setNs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  
  const playerRef = useRef(null);
  const visualizersRef = useRef(new Set());
  const mmRef = useRef(null);
  
  // 加载Magenta库
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isMounted = true;
    
    const loadMagenta = async () => {
      try {
        setLoading(true);
        const mm = await waitForMagenta();
        if (isMounted) {
          mmRef.current = mm;
          setLoading(false);
          
          // 如果提供了src，初始化播放器
          if (src) {
            initPlayer(mm);
          }
        }
      } catch (error) {
        console.error('加载Magenta库失败:', error);
        if (isMounted) {
          setError('加载Magenta库失败: ' + error.message);
          setLoading(false);
        }
      }
    };
    
    loadMagenta();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // 初始化播放器
  const initPlayer = async (mm = mmRef.current) => {
    if (!src && !ns || !mm) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let noteSequence = ns;
      if (src && !noteSequence) {
        noteSequence = await mm.urlToNoteSequence(src);
        setNs(noteSequence);
      }
      
      if (!noteSequence) {
        setError('无法加载MIDI内容');
        setLoading(false);
        return;
      }
      
      setDuration(noteSequence.totalTime);
      setCurrentTime(0);
      
      const callbackObject = {
        run: (note) => noteCallback(note),
        stop: () => {}
      };
      
      if (soundFont === null) {
        playerRef.current = new mm.Player(false, callbackObject);
      } else {
        const soundFontUrl = soundFont === "" ? DEFAULT_SOUNDFONT : soundFont;
        playerRef.current = new mm.SoundFontPlayer(soundFontUrl, undefined, undefined, undefined, callbackObject);
        await playerRef.current.loadSamples(noteSequence);
      }
      
      setLoading(false);
      if (onLoad) onLoad();
    } catch (error) {
      console.error('MIDI播放器初始化失败:', error);
      setError('MIDI播放器初始化失败: ' + error.message);
      setLoading(false);
    }
  };
  
  // 处理音符播放回调
  const noteCallback = (note) => {
    if (!playing || seeking) return;
    
    console.log("处理音符回调:", note);
    setCurrentTime(note.startTime);
    
    // 触发音符事件回调
    if (onNote) {
      onNote({ detail: { note } });
    }
    
    // 直接调用可视化器的redraw方法
    if (visualizer && visualizer.redraw) {
      console.log("直接调用可视化器redraw:", note);
      visualizer.redraw(note);
    }
    
    // 更新可视化器
    if (visualizersRef.current.size > 0) {
      visualizersRef.current.forEach(visualizerItem => {
        if (visualizerItem && visualizerItem.redraw) {
          visualizerItem.redraw(note);
        }
      });
    }
  };
  
  // 开始播放
  const start = async (looped = false) => {
    if (!playerRef.current || !ns) return;
    
    if (playerRef.current.getPlayState() === 'stopped') {
      // 停止其他正在播放的播放器
      if (playingPlayer && playingPlayer !== playerRef.current && playingPlayer.isPlaying()) {
        playingPlayer.stop();
      }
      
      playingPlayer = playerRef.current;
      setPlaying(true);
      
      let offset = currentTime;
      // 如果没有剩余音符要播放，则跳到开始
      if (ns.notes.filter(note => note.startTime > offset).length === 0) {
        offset = 0;
        setCurrentTime(0);
      }
      
      // 更新可视化器
      if (visualizer) {
        visualizer.noteSequence = ns;
        if (visualizer.reload) {
          visualizer.reload();
        }
      }
      
      visualizersRef.current.forEach(visualizerItem => {
        if (visualizerItem) {
          visualizerItem.noteSequence = ns;
          if (visualizerItem.reload) {
            visualizerItem.reload();
          }
        }
      });
      
      try {
        if (looped) {
          if (onLoop) onLoop();
        } else {
          if (onStart) onStart();
        }
        
        await playerRef.current.start(ns, undefined, offset);
        handleStop(true);
      } catch (error) {
        console.error('播放失败:', error);
        handleStop(false);
      }
    } else if (playerRef.current.getPlayState() === 'paused') {
      playerRef.current.resume();
    }
  };
  
  // 停止播放
  const stop = () => {
    if (playerRef.current && playerRef.current.isPlaying()) {
      playerRef.current.stop();
    }
    handleStop(false);
  };
  
  // 处理停止播放
  const handleStop = (finished = false) => {
    if (finished) {
      if (loop) {
        setCurrentTime(0);
        start(true);
        return;
      }
      setCurrentTime(duration);
    }
    
    if (playing) {
      setPlaying(false);
      if (onStop) onStop({ detail: { finished } });
      
      // 清除可视化器活动音符
      if (visualizer && visualizer.clearActiveNotes) {
        visualizer.clearActiveNotes();
      }
      
      visualizersRef.current.forEach(visualizerItem => {
        if (visualizerItem && visualizerItem.clearActiveNotes) {
          visualizerItem.clearActiveNotes();
        }
      });
    }
  };
  
  // 处理滑块变化
  const handleSliderChange = (_, newValue) => {
    setSeeking(true);
    setCurrentTime(newValue);
    
    // 暂停播放，直到用户完成拖动
    if (playerRef.current && playerRef.current.getPlayState() === 'started') {
      playerRef.current.pause();
    }
  };
  
  // 处理滑块变化完成
  const handleSliderChangeCommitted = (_, newValue) => {
    setCurrentTime(newValue);
    
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.seekTo(newValue);
        if (playerRef.current.getPlayState() === 'paused') {
          playerRef.current.resume();
        }
      }
    }
    
    setSeeking(false);
  };
  
  // 添加可视化器
  const addVisualizer = (visualizerItem) => {
    if (visualizerItem && !visualizersRef.current.has(visualizerItem)) {
      visualizersRef.current.add(visualizerItem);
      if (ns) {
        visualizerItem.noteSequence = ns;
      }
    }
  };
  
  // 移除可视化器
  const removeVisualizer = (visualizerItem) => {
    if (visualizerItem && visualizersRef.current.has(visualizerItem)) {
      visualizersRef.current.delete(visualizerItem);
    }
  };
  
  // 监听src变化
  useEffect(() => {
    if (mmRef.current && src) {
      setNs(null);
      initPlayer();
    }
  }, [src]);
  
  // 监听noteSequence变化
  useEffect(() => {
    if (mmRef.current && ns) {
      initPlayer();
    }
  }, [ns]);
  
  // 监听visualizer变化
  useEffect(() => {
    if (visualizer) {
      addVisualizer(visualizer);
    }
    
    return () => {
      if (visualizer) {
        removeVisualizer(visualizer);
      }
    };
  }, [visualizer]);
  
  // 监听soundFont变化
  useEffect(() => {
    if (mmRef.current && ns) {
      initPlayer();
    }
  }, [soundFont]);
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    start,
    stop,
    get playing() {
      return playing;
    },
    get currentTime() {
      return currentTime;
    },
    set currentTime(value) {
      setCurrentTime(value);
      if (playerRef.current && playerRef.current.isPlaying()) {
        playerRef.current.seekTo(value);
      }
    },
    get duration() {
      return duration;
    },
    get noteSequence() {
      return ns;
    }
  }));
  
  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current.isPlaying()) {
        playerRef.current.stop();
      }
    };
  }, []);
  
  return (
    <Paper 
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 1,
        backgroundColor: error ? 'error.light' : 'background.paper',
        opacity: loading ? 0.7 : 1,
        pointerEvents: loading || error ? 'none' : 'auto',
      }}
    >
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1 
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Button 
          variant="contained" 
          disabled={loading || error} 
          onClick={playing ? stop : start}
          sx={{ 
            mr: 2, 
            minWidth: 0, 
            p: 1,
            color: playing ? 'primary.contrastText' : undefined,
            backgroundColor: playing ? 'primary.main' : undefined,
          }}
        >
          {playing ? <StopIcon /> : <PlayArrowIcon />}
        </Button>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Slider
            value={currentTime}
            min={0}
            max={duration || 1}
            step={0.01}
            disabled={loading || error || duration === 0}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <ErrorOutlineIcon color="error" sx={{ ml: 1 }} />
        )}
      </Box>
    </Paper>
  );
});

MidiPlayer.displayName = 'MidiPlayer';

export default MidiPlayer;