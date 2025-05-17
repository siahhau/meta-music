"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Slider, Button, FormControlLabel, Switch } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// 音符数据到MIDI音高的映射
const scaleDegreesToMidiNote = {
  "1": 60, // C
  "2": 62, // D
  "3": 64, // E
  "4": 65, // F
  "5": 67, // G
  "6": 69, // A
  "7": 71  // B
};

// 根音数字到音符名称的映射
const rootToNoteName = {
  1: "C",
  2: "D",
  3: "E",
  4: "F",
  5: "G",
  6: "A",
  7: "B",
  8: "C",
  9: "D",
  10: "E",
  11: "F",
  12: "G"
};

// 和弦类型映射
const chordTypeMap = {
  5: "", // 大三和弦
  3: "m", // 小三和弦
  4: "aug", // 增三和弦
  2: "dim", // 减三和弦
  1: "sus2", // 挂二
  6: "sus4", // 挂四
  7: "7", // 属七
  8: "maj7", // 大七
  9: "m7", // 小七
  10: "dim7", // 减七
  11: "hdim7", // 半减七
  12: "aug7", // 增七
  13: "9", // 属九
  14: "maj9", // 大九
  15: "m9", // 小九
  16: "6", // 大六
  17: "m6", // 小六
  18: "5", // 五度
};

const PianoRollVisualizer = ({ 
  data, 
  width = 800, 
  height = 400, 
  pixelsPerBeat = 40,
  noteHeight = 15,
  showChords = true,
  showSections = true,
  autoScroll = true,
  showNoteNames = true
}) => {
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [transpose, setTranspose] = useState(0);
  const [highlightDiatonic, setHighlightDiatonic] = useState(true);
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // 计算总时长（以拍为单位）
  useEffect(() => {
    if (!data) return;
    
    // 找出最后一个音符或和弦的结束位置
    let lastBeat = 1;
    
    if (data.notes && data.notes.length > 0) {
      const lastNote = data.notes.reduce((latest, note) => {
        const endBeat = note.beat + note.duration;
        return endBeat > latest ? endBeat : latest;
      }, 1);
      lastBeat = Math.max(lastBeat, lastNote);
    }
    
    if (data.chords && data.chords.length > 0) {
      const lastChord = data.chords.reduce((latest, chord) => {
        const endBeat = chord.beat + chord.duration;
        return endBeat > latest ? endBeat : latest;
      }, 1);
      lastBeat = Math.max(lastBeat, lastChord);
    }
    
    if (data.keyFrames && data.keyFrames.length > 0) {
      const lastKeyFrame = Math.max(...data.keyFrames.map(kf => kf.beat));
      lastBeat = Math.max(lastBeat, lastKeyFrame);
    }
    
    if (data.endBeat) {
      lastBeat = Math.max(lastBeat, data.endBeat);
    }
    
    setDuration(lastBeat);
    
    // 提取初始速度
    if (data.tempos && data.tempos.length > 0) {
      setTempo(data.tempos[0].bpm);
    }
  }, [data]);
  
  // 渲染钢琴卷帘视图
  const renderPianoRoll = () => {
    if (!data) return null;
    
    // 计算整体宽度
    const totalWidth = Math.max(width, duration * pixelsPerBeat);
    
    // 音高范围 (MIDI音符号码36-84，覆盖3个八度)
    const minPitch = 48; // C3
    const maxPitch = 84; // C6
    
    // 提取调性
    const key = data.keys && data.keys.length > 0 ? data.keys[0] : { scale: "major", tonic: "C" };
    
    // 获取白键音符的MIDI号码，用于高亮显示
    const getDiatonicNotesForKey = (tonic) => {
      // 基于调性计算音阶音符
      const keyToOffset = {
        "C": 0, "C#": 1, "Db": 1, 
        "D": 2, "D#": 3, "Eb": 3,
        "E": 4, "F": 5, "F#": 6, 
        "Gb": 6, "G": 7, "G#": 8, 
        "Ab": 8, "A": 9, "A#": 10, 
        "Bb": 10, "B": 11
      };
      
      const offset = keyToOffset[tonic] || 0;
      
      // 大调音阶模式 (全全半全全全半)
      const majorScale = [0, 2, 4, 5, 7, 9, 11];
      
      // 生成这个调的白键音符
      const diatonicNotes = [];
      for (let octave = 0; octave < 10; octave++) {
        for (const interval of majorScale) {
          const note = octave * 12 + interval + offset;
          diatonicNotes.push(note);
        }
      }
      
      return diatonicNotes;
    };
    
    const diatonicNotes = getDiatonicNotesForKey(key.tonic);
    
    // 绘制音符
    const renderNotes = () => {
      if (!data.notes || data.notes.length === 0) return null;
      
      return data.notes.map((note, index) => {
        if (note.isRest) return null;
        
        // 计算MIDI音高
        let midiPitch;
        if (note.sd in scaleDegreesToMidiNote) {
          // 根据音符在音阶中的位置和八度计算MIDI音高
          midiPitch = scaleDegreesToMidiNote[note.sd] + (note.octave * 12) + transpose;
        } else {
          // 对于无法识别的音符，使用默认值
          midiPitch = 60 + (note.octave * 12) + transpose;
        }
        
        // 如果音符超出显示范围，则不显示
        if (midiPitch < minPitch || midiPitch > maxPitch) return null;
        
        // 计算位置
        const x = (note.beat - 1) * pixelsPerBeat;
        const y = height - ((midiPitch - minPitch + 1) * noteHeight);
        const width = note.duration * pixelsPerBeat;
        
        // 检查是否是白键（属于调性中的音符）
        const isDiatonic = diatonicNotes.includes(midiPitch);
        
        // 检查是否是当前播放的音符
        const isActive = playing && 
                         currentBeat >= note.beat && 
                         currentBeat < note.beat + note.duration;
        
        // 确定音符颜色
        let backgroundColor;
        if (isActive) {
          backgroundColor = 'rgba(255, 0, 0, 0.8)'; // 红色活动音符
        } else if (highlightDiatonic && isDiatonic) {
          backgroundColor = 'rgba(64, 128, 255, 0.8)'; // 蓝色音阶音符
        } else {
          backgroundColor = 'rgba(128, 128, 128, 0.8)'; // 灰色非音阶音符
        }
        
        return (
          <Box
            key={`note-${index}`}
            sx={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${noteHeight}px`,
              backgroundColor,
              borderRadius: '3px',
              border: isActive ? '2px solid red' : '1px solid rgba(0, 0, 0, 0.3)',
              zIndex: isActive ? 2 : 1,
              transition: 'background-color 0.1s',
              '&:hover': {
                filter: 'brightness(1.2)',
              }
            }}
            title={`音符: ${note.sd}, 八度: ${note.octave}, 时值: ${note.duration}`}
          >
            {showNoteNames && width >= 20 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'white', 
                  fontSize: '0.7rem',
                  textShadow: '0px 0px 2px black',
                  position: 'absolute',
                  top: '1px',
                  left: '2px'
                }}
              >
                {note.sd}
              </Typography>
            )}
          </Box>
        );
      });
    };
    
    // 绘制和弦
    const renderChords = () => {
      if (!showChords || !data.chords || data.chords.length === 0) return null;
      
      return data.chords.map((chord, index) => {
        // 计算位置
        const x = (chord.beat - 1) * pixelsPerBeat;
        const width = chord.duration * pixelsPerBeat;
        
        // 生成和弦名称
        const rootName = rootToNoteName[chord.root] || '';
        const chordType = chordTypeMap[chord.type] || '';
        const chordName = `${rootName}${chordType}`;
        
        // 检查是否是当前播放的和弦
        const isActive = playing && 
                         currentBeat >= chord.beat && 
                         currentBeat < chord.beat + chord.duration;
        
        return (
          <Box
            key={`chord-${index}`}
            sx={{
              position: 'absolute',
              left: `${x}px`,
              top: '0px',
              width: `${width}px`,
              height: '24px',
              backgroundColor: isActive ? 'rgba(255, 200, 0, 0.8)' : 'rgba(200, 200, 200, 0.7)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '3px 3px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: isActive ? 2 : 1,
              boxShadow: isActive ? '0 0 5px rgba(255, 200, 0, 0.5)' : 'none'
            }}
            title={`和弦: ${chordName}, 时值: ${chord.duration}`}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              {chordName}
            </Typography>
          </Box>
        );
      });
    };
    
    // 绘制小节线
    const renderMeasureLines = () => {
      if (!data.meters || data.meters.length === 0) return null;
      
      const meter = data.meters[0]; // 假设只使用第一个拍号
      const beatsPerMeasure = meter.numBeats;
      
      const lines = [];
      for (let beat = 1; beat <= duration; beat += beatsPerMeasure) {
        const x = (beat - 1) * pixelsPerBeat;
        lines.push(
          <Box
            key={`measure-${beat}`}
            sx={{
              position: 'absolute',
              left: `${x}px`,
              top: '0',
              width: '1px',
              height: '100%',
              backgroundColor: beat === 1 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
              zIndex: 0
            }}
          />
        );
        
        // 添加小节号
        lines.push(
          <Typography
            key={`measure-num-${beat}`}
            variant="caption"
            sx={{
              position: 'absolute',
              left: `${x + 2}px`,
              bottom: '2px',
              color: 'rgba(0, 0, 0, 0.6)',
              fontSize: '0.7rem',
              zIndex: 0
            }}
          >
            {Math.floor((beat - 1) / beatsPerMeasure) + 1}
          </Typography>
        );
      }
      
      return lines;
    };
    
    // 绘制当前播放位置标记线
    const renderPlayhead = () => {
      if (!playing) return null;
      
      const x = (currentBeat - 1) * pixelsPerBeat;
      
      return (
        <Box
          sx={{
            position: 'absolute',
            left: `${x}px`,
            top: '0',
            width: '2px',
            height: '100%',
            backgroundColor: 'red',
            zIndex: 3
          }}
        />
      );
    };
    
    // 绘制区段标记
    const renderSections = () => {
      if (!showSections || !data.sections || data.sections.length === 0) return null;
      
      return data.sections.map((section, index) => {
        const x = (section.beat - 1) * pixelsPerBeat;
        const nextSectionBeat = index < data.sections.length - 1 
          ? data.sections[index + 1].beat 
          : duration + 1;
        const width = (nextSectionBeat - section.beat) * pixelsPerBeat;
        
        // 为不同类型的段落选择不同颜色
        const getSectionColor = (name) => {
          const colorMap = {
            'Intro': 'rgba(144, 238, 144, 0.3)', // 淡绿色
            'Verse': 'rgba(173, 216, 230, 0.3)', // 淡蓝色
            'Chorus': 'rgba(255, 182, 193, 0.3)', // 淡粉色
            'Bridge': 'rgba(255, 222, 173, 0.3)', // 淡橙色
            'Outro': 'rgba(216, 191, 216, 0.3)', // 淡紫色
            'Pre': 'rgba(255, 255, 173, 0.3)', // 淡黄色
          };
          
          // 检查名称是否包含关键词（例如"Verse 2"应该使用"Verse"的颜色）
          for (const key of Object.keys(colorMap)) {
            if (name.includes(key)) {
              return colorMap[key];
            }
          }
          
          // 默认颜色
          return 'rgba(200, 200, 200, 0.3)';
        };
        
        return (
          <React.Fragment key={`section-${index}`}>
            <Box
              sx={{
                position: 'absolute',
                left: `${x}px`,
                top: '25px', // 放在和弦下方
                width: `${width}px`,
                height: 'calc(100% - 25px)',
                backgroundColor: getSectionColor(section.name),
                borderLeft: '2px solid rgba(0, 0, 0, 0.2)',
                zIndex: 0
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                left: `${x + 5}px`,
                top: '26px',
                color: 'rgba(0, 0, 0, 0.7)',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                zIndex: 1
              }}
            >
              {section.name}
            </Typography>
          </React.Fragment>
        );
      });
    };
    
    // 绘制钢琴键盘（左侧）
    const renderPianoKeys = () => {
      const keys = [];
      const totalKeys = maxPitch - minPitch + 1;
      
      for (let i = 0; i < totalKeys; i++) {
        const pitch = minPitch + i;
        const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
        const y = height - ((pitch - minPitch + 1) * noteHeight);
        
        // 仅绘制C调的音符名称（简化起见）
        const showNoteName = pitch % 12 === 0; // C音
        const noteName = showNoteName ? `C${Math.floor(pitch / 12) - 1}` : '';
        
        keys.push(
          <Box
            key={`key-${pitch}`}
            sx={{
              position: 'absolute',
              left: '0',
              top: `${y}px`,
              width: '40px',
              height: `${noteHeight}px`,
              backgroundColor: isBlackKey ? '#333' : '#fff',
              border: '1px solid #999',
              borderRadius: '0 3px 3px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            {showNoteName && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(0, 0, 0, 0.7)' }}>
                {noteName}
              </Typography>
            )}
          </Box>
        );
      }
      
      return keys;
    };
    
    return (
      <Box sx={{ position: 'relative', mb: 2 }}>
        {/* 钢琴键盘区域 */}
        <Box
          sx={{
            position: 'absolute',
            left: '0',
            top: '0',
            width: '40px',
            height: `${height}px`,
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #ccc',
            zIndex: 2
          }}
        >
          {renderPianoKeys()}
        </Box>
        
        {/* 可滚动区域 */}
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            marginLeft: '40px', // 为钢琴键盘留出空间
            width: `${width}px`,
            height: `${height}px`,
            overflowX: 'auto',
            overflowY: 'hidden',
            backgroundColor: '#f8f8f8',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: `${totalWidth}px`,
              height: '100%'
            }}
          >
            {renderSections()}
            {renderMeasureLines()}
            {renderChords()}
            {renderNotes()}
            {renderPlayhead()}
          </Box>
        </Box>
      </Box>
    );
  };
  
  // 播放功能
  const startPlayback = () => {
    if (playing) return;
    
    setPlaying(true);
    startTimeRef.current = performance.now();
    
    // 计算每拍的毫秒数
    const msPerBeat = 60000 / tempo;
    
    const animate = (timestamp) => {
      const elapsed = timestamp - startTimeRef.current;
      const newBeat = 1 + (elapsed / msPerBeat);
      
      if (newBeat > duration) {
        // 播放结束
        setPlaying(false);
        setCurrentBeat(1);
        return;
      }
      
      setCurrentBeat(newBeat);
      
      // 如果启用了自动滚动，确保播放头位置可见
      if (autoScroll && containerRef.current) {
        const x = (newBeat - 1) * pixelsPerBeat;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        
        // 确保播放头位置在可视区域内
        if (x < container.scrollLeft || x > container.scrollLeft + containerWidth - 50) {
          container.scrollLeft = Math.max(0, x - containerWidth / 3);
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  const stopPlayback = () => {
    if (!playing) return;
    
    cancelAnimationFrame(animationRef.current);
    setPlaying(false);
  };
  
  const resetPlayback = () => {
    stopPlayback();
    setCurrentBeat(1);
    
    // 重置滚动位置
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  };
  
  // 处理滑块变化
  const handleSeek = (_, newValue) => {
    setCurrentBeat(newValue);
    
    // 更新滚动位置
    if (containerRef.current) {
      const x = (newValue - 1) * pixelsPerBeat;
      containerRef.current.scrollLeft = Math.max(0, x - containerRef.current.clientWidth / 3);
    }
  };
  
  // 调整八度
  const handleTranspose = (_, value) => {
    setTranspose(value);
  };
  
  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // 数据变化时重置播放状态
  useEffect(() => {
    resetPlayback();
  }, [data]);
  
  if (!data) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>无MIDI数据</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom style={{marginLeft: 50}}>MIDI钢琴卷帘视图</Typography>
      
      {/* 控制区域 */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} style={{marginLeft: 50}}>
        <Box sx={{ mr: 2 }}>
          <Button
            variant="contained"
            color={playing ? "error" : "primary"}
            onClick={playing ? stopPlayback : startPlayback}
            startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
            sx={{ mr: 1 }}
          >
            {playing ? "停止" : "播放"}
          </Button>
          <Button
            variant="outlined"
            onClick={resetPlayback}
            startIcon={<RestartAltIcon />}
          >
            重置
          </Button>
        </Box>
        
        <Box sx={{ flex: 1, mx: 2 }}>
          <Slider
            value={currentBeat}
            min={1}
            max={duration}
            step={0.01}
            onChange={handleSeek}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `第 ${Math.floor(value)} 拍`}
          />
        </Box>
        
        <Typography variant="body2" sx={{ mx: 2 }}>
          速度: {tempo} BPM
        </Typography>
      </Box>
      
      {/* 额外控制选项 */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap' }} style={{marginLeft: 50}}>
        <Box sx={{ mr: 3, minWidth: 120 }}>
          <Typography variant="body2" gutterBottom>八度调整</Typography>
          <Slider
            value={transpose}
            min={-12}
            max={12}
            step={12}
            marks
            valueLabelDisplay="auto"
            onChange={handleTranspose}
          />
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={showChords}
              onChange={(e) => setShowChords(e.target.checked)}
            />
          }
          label="显示和弦"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={showSections}
              onChange={(e) => setShowSections(e.target.checked)}
            />
          }
          label="显示段落"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
          }
          label="自动滚动"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={highlightDiatonic}
              onChange={(e) => setHighlightDiatonic(e.target.checked)}
            />
          }
          label="高亮调内音"
        />
      </Box>
      
      {/* 钢琴卷帘视图 */}
      {renderPianoRoll()}
      
      {/* 显示歌词（如果有） */}
      {data.lyrics && data.lyrics.values && data.lyrics.values.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>歌词</Typography>
          {data.lyrics.values.map((line, index) => (
            <Typography key={`lyric-${index}`} variant="body2">
              {line || '　'}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default PianoRollVisualizer;