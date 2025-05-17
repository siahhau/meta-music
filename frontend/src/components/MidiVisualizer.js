"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { waitForMagenta } from '../utils/magenta'; // 保留之前的magenta工具函数

// 可视化器类型
const VISUALIZER_TYPES = ['piano-roll', 'waterfall', 'staff'];

const MidiVisualizer = forwardRef(({ 
  src, 
  type = 'piano-roll', 
  config = {},
  noteSequence: propNoteSequence,
  height = 300,
  allowTypeChange = true,
  followActiveNotes = true
}, ref) => {
  const [ns, setNs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizerType, setVisualizerType] = useState(type);
  const [activeNote, setActiveNote] = useState(null);
  
  const containerRef = useRef(null);
  const visualizerRef = useRef(null);
  const mmRef = useRef(null);
  
  // 加载Magenta库及依赖库
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isMounted = true;
    
    // 动态加载所需的CDN脚本
    const loadScripts = async () => {
      try {
        // 检查是否已加载
        if (window.Tone && (window.core || window.mm)) {
          if (isMounted) {
            mmRef.current = window.core || window.mm;
            setLoading(false);
            return;
          }
        }
        
        // 加载Tone.js
        if (!window.Tone) {
          const toneScript = document.createElement('script');
          toneScript.src = 'https://cdn.jsdelivr.net/npm/tone@14.7.58';
          toneScript.async = true;
          document.body.appendChild(toneScript);
        }
        
        // 加载Magenta.js
        if (!window.core && !window.mm) {
          const magentaScript = document.createElement('script');
          magentaScript.src = 'https://cdn.jsdelivr.net/npm/@magenta/music@1.23.1/es6/core.js';
          magentaScript.async = true;
          document.body.appendChild(magentaScript);
        }
        
        // 等待Magenta库加载完成
        const mm = await waitForMagenta();
        if (isMounted) {
          mmRef.current = mm;
          setLoading(false);
          
          // 初始化可视化器
          if (src) {
            setNs(null);
            initVisualizer(mm);
          } else if (propNoteSequence) {
            setNs(propNoteSequence);
            initVisualizer(mm);
          } else {
            // 如果没有提供MIDI源，则尝试使用示例
            try {
              const sampleMidiUrl = 'https://cdn.jsdelivr.net/gh/cifkao/html-midi-player@2b12128/twinkle_twinkle.mid';
              const noteSequence = await mm.urlToNoteSequence(sampleMidiUrl);
              setNs(noteSequence);
              initVisualizer(mm);
            } catch (err) {
              console.error('加载示例MIDI失败:', err);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('加载MIDI可视化所需库失败:', error);
        if (isMounted) {
          setError('加载MIDI可视化所需库失败: ' + error.message);
          setLoading(false);
        }
      }
    };
    
    loadScripts();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // 初始化可视化器
  const initVisualizer = async (mm = mmRef.current) => {
    if (!containerRef.current || !mm) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let noteSequence = ns;
      if (src && !noteSequence) {
        noteSequence = await mm.urlToNoteSequence(src);
        setNs(noteSequence);
      } else if (propNoteSequence && !noteSequence) {
        noteSequence = propNoteSequence;
        setNs(noteSequence);
      }
      
      if (!noteSequence) {
        setLoading(false);
        return;
      }
      
      // 清空容器
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      const validType = VISUALIZER_TYPES.includes(visualizerType) ? visualizerType : 'piano-roll';
      
      // 创建相应类型的可视化器，根据可视化器类型设置不同的配置
      let combinedConfig = { ...config };
      
      // 为不同类型的可视化器添加增强配置
      if (validType === 'piano-roll') {
        // 钢琴卷帘视图增强配置
        combinedConfig = {
          noteHeight: 6, // 提高音符高度，使显示更清晰
          pixelsPerTimeStep: 60, // 增加时间步长的像素数，让音符更宽
          noteSpacing: 1, // 音符间距
          noteRGB: '64, 128, 255', // 默认音符颜色 (蓝色)
          activeNoteRGB: '255, 0, 0', // 当前播放音符颜色 (红色)
          ...combinedConfig
        };
      } else if (validType === 'waterfall') {
        // 瀑布视图增强配置
        combinedConfig = {
          noteHeight: 4,
          pixelsPerTimeStep: 60,
          noteRGB: '64, 128, 255', // 默认音符颜色
          activeNoteRGB: '255, 0, 0', // 当前播放音符颜色
          showOnlyOctavesUsed: true, // 只显示使用的八度音阶，节省空间
          ...combinedConfig
        };
      } else if (validType === 'staff') {
        // 五线谱视图增强配置
        combinedConfig = {
          noteHeight: 6,
          noteSpacing: 1,
          noteRGB: '64, 128, 255', // 默认音符颜色
          activeNoteRGB: '255, 0, 0', // 当前播放音符颜色
          ...combinedConfig
        };
      }
      
      // 创建相应类型的可视化器
      if (validType === 'piano-roll') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        containerRef.current.appendChild(svg);
        visualizerRef.current = new mm.PianoRollSVGVisualizer(noteSequence, svg, combinedConfig);
      } else if (validType === 'waterfall') {
        visualizerRef.current = new mm.WaterfallSVGVisualizer(noteSequence, containerRef.current, combinedConfig);
      } else if (validType === 'staff') {
        const div = document.createElement('div');
        containerRef.current.appendChild(div);
        visualizerRef.current = new mm.StaffSVGVisualizer(noteSequence, div, combinedConfig);
      }
      
      // 添加自定义样式以增强活动音符的可见性
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .active {
          fill: rgba(255, 0, 0, 0.8) !important;
          stroke: #ff0000 !important;
          stroke-width: 2px !important;
          filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.7));
          z-index: 10;
        }
      `;
      document.head.appendChild(styleElement);
      
      setLoading(false);
    } catch (error) {
      console.error('可视化器初始化失败:', error);
      setError('可视化器初始化失败: ' + error.message);
      setLoading(false);
    }
  };
  
  // 重新加载可视化器
  const reload = () => {
    initVisualizer();
  };
  
  // 重绘可视化器，更新当前活动音符
  const redraw = (note) => {
    if (visualizerRef.current) {
      console.log("重绘可视化器，活动音符:", note);
      setActiveNote(note);
      
      // 确保以下参数传递正确
      visualizerRef.current.redraw(note, true);
      
      // 如果启用了自动滚动和有活动音符，滚动到当前音符位置
      if (followActiveNotes && note && containerRef.current) {
        setTimeout(() => {
          // 尝试找到当前音符元素
          const activeNotes = containerRef.current.querySelectorAll('.active');
          console.log("找到活动音符元素:", activeNotes.length);
          
          if (activeNotes.length > 0) {
            const activeNote = activeNotes[0];
            
            // 获取可视区域的尺寸
            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const noteRect = activeNote.getBoundingClientRect();
            
            // 根据可视化器类型有不同的滚动行为
            if (visualizerType === 'piano-roll') {
              // 横向滚动，让活动音符位于可视区域的中间位置
              if (noteRect.left < containerRect.left || noteRect.right > containerRect.right) {
                const scrollPosition = noteRect.left + container.scrollLeft - containerRect.left - containerRect.width / 2 + noteRect.width / 2;
                container.scrollLeft = Math.max(0, scrollPosition);
              }
            } else if (visualizerType === 'waterfall') {
              // 纵向滚动，让活动音符位于可视区域的上部
              if (noteRect.top < containerRect.top) {
                container.scrollTop = Math.max(0, container.scrollTop + (noteRect.top - containerRect.top) - 50);
              }
            } else if (visualizerType === 'staff') {
              // 横向滚动，让活动音符位于可视区域的左侧区域
              if (noteRect.left < containerRect.left || noteRect.right > containerRect.right) {
                const scrollPosition = noteRect.left + container.scrollLeft - containerRect.left - 100; // 偏移100px，这样音符不会贴边
                container.scrollLeft = Math.max(0, scrollPosition);
              }
            }
          }
        }, 10); // 小延迟确保DOM已更新
      }
    }
  };
  
  // 清除活动音符
  const clearActiveNotes = () => {
    if (visualizerRef.current) {
      visualizerRef.current.clearActiveNotes();
      setActiveNote(null);
    }
  };
  
  // 处理可视化器类型变更
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setVisualizerType(newType);
  };
  
  // 监听visualizerType变化
  useEffect(() => {
    if (mmRef.current && ns) {
      initVisualizer();
    }
  }, [visualizerType]);
  
  // 监听src变化
  useEffect(() => {
    if (mmRef.current && src) {
      setNs(null);
      initVisualizer();
    }
  }, [src]);
  
  // 监听propNoteSequence变化
  useEffect(() => {
    if (mmRef.current && propNoteSequence) {
      setNs(propNoteSequence);
      initVisualizer();
    }
  }, [propNoteSequence]);
  
  // 监听config变化
  useEffect(() => {
    if (mmRef.current && ns) {
      initVisualizer();
    }
  }, [config]);
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    reload,
    redraw,
    clearActiveNotes,
    get noteSequence() {
      return ns;
    },
    set noteSequence(value) {
      setNs(value);
    },
    get activeNote() {
      return activeNote;
    }
  }));
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">MIDI 可视化</Typography>
        
        {allowTypeChange && (
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="visualizer-type-label">可视化类型</InputLabel>
            <Select
              labelId="visualizer-type-label"
              id="visualizer-type"
              value={visualizerType}
              onChange={handleTypeChange}
              label="可视化类型"
            >
              <MenuItem value="piano-roll">钢琴卷帘</MenuItem>
              <MenuItem value="waterfall">瀑布视图</MenuItem>
              <MenuItem value="staff">五线谱</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box sx={{ p: 2, textAlign: 'center', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}
      
      <Box
        ref={containerRef}
        className={`${visualizerType}-visualizer`}
        sx={{ 
          height,
          width: '100%',
          overflow: 'auto',
          display: loading || error ? 'none' : 'block',
          '& svg': {
            width: '100%',
            minWidth: '500px', // 确保有足够宽度显示内容
            height: '100%',
          }
        }}
      />
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
        {!src && !propNoteSequence && !error && !loading && '当前显示示例MIDI: "小星星"'}
        {activeNote && `当前音符: ${activeNote.pitch} (时间: ${activeNote.startTime.toFixed(2)}s)`}
      </Typography>
    </Paper>
  );
});

MidiVisualizer.displayName = 'MidiVisualizer';

export default MidiVisualizer;