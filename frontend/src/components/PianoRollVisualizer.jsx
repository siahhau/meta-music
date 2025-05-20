"use client";

// 导入必要的 React 和 Material-UI 组件
import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Slider, Button, FormControlLabel, Switch} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MIDI from './acoustic_grand_piano-mp3';

// 和弦类型映射
const chordTypeMap = {
  5: "", // 大三和弦
  3: "m", // 小三和弦
  4: "aug", // 增三和弦
  2: "dim", // 减三和弦
  1: "sus2", // 挂二和弦
  6: "sus4", // 挂四和弦
  7: "7", // 属七和弦
  8: "maj7", // 大七和弦
  9: "m7", // 小七和弦
  10: "dim7", // 减七和弦
  11: "hdim7", // 半减七和弦
  12: "aug7", // 增七和弦
  13: "9", // 属九和弦
  14: "maj9", // 大九和弦
  15: "m9", // 小九和弦
  16: "6", // 大六和弦
  17: "m6", // 小六和弦
  18: "5", // 五度和弦
};

// 根据调性动态生成 rootToNoteName 映射
const generateRootToNoteName = (tonic, scale = "major") => {
  const majorScaleNotes = {
    "C": ["C", "D", "E", "F", "G", "A", "B"],
    "B": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  };
  const scaleNotes = majorScaleNotes[tonic] || majorScaleNotes["C"];
  const rootMap = {};
  for (let i = 1; i <= 7; i++) {
    rootMap[i] = scaleNotes[i - 1];
  }
  for (let i = 8; i <= 12; i++) {
    rootMap[i] = scaleNotes[(i - 1) % 7];
  }
  return rootMap;
};

// 根据调性动态生成音阶度数到 MIDI 音高的映射
const generateScaleDegreesToMidiNote = (tonic, scale = "major") => {
  const noteToMidiBase = {
    "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
    "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68,
    "Ab": 68, "A": 69, "A#": 70, "Bb": 70, "B": 71
  };
  const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
  const tonicMidi = noteToMidiBase[tonic] || 60;
  const scaleMap = {};
  majorScaleIntervals.forEach((interval, index) => {
    scaleMap[(index + 1).toString()] = tonicMidi + interval;
  });
  return scaleMap;
};

// 将 MIDI 音高转换为音符名称（例如，71 → "B4"）
const midiToNoteName = (midiPitch) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiPitch / 12) - 1;
  const noteIndex = midiPitch % 12;
  return `${noteNames[noteIndex]}${octave}`;
};

// MIDI 音符号到 Soundfont 键名的映射函数
const midiToSoundfontKey = (midiNumber) => {
  const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${noteNames[noteIndex]}${octave}`;
};

// 生成键名变体以兼容不同 Soundfont 格式
const generateKeyNameVariations = (midiNumber) => {
  const pitchClass = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const variations = [];
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  variations.push(`${flatNames[pitchClass]}${octave}`);
  variations.push(`${sharpNames[pitchClass]}${octave}`);
  variations.push(`${flatNames[pitchClass].toLowerCase()}${octave}`);
  variations.push(`${sharpNames[pitchClass].toLowerCase()}${octave}`);

  if ([1, 3, 6, 8, 10].includes(pitchClass)) {
    variations.push(`${sharpNames[pitchClass - 1]}_sharp${octave}`);
    variations.push(`${flatNames[pitchClass + 1]}_flat${octave}`);
  }

  variations.push(`${flatNames[pitchClass]}`);
  variations.push(`${sharpNames[pitchClass]}`);
  variations.push(`note_${midiNumber}`);
  variations.push(`key_${midiNumber}`);

  return variations;
};

// 主组件：钢琴卷帘视图
const PianoRollVisualizer = ({
  data,
  width = 800,
  height = 400,
  pixelsPerBeat = 40,
  noteHeight = 15,
  showChords = true,
  showSections = true,
  autoScroll = true,
  showNoteNames = true,
  showPlayhead = false
}) => {
  // 状态变量
  const [playing, setPlaying] = useState(false); // 是否正在播放
  const [currentBeat, setCurrentBeat] = useState(1); // 当前播放节拍
  const [duration, setDuration] = useState(0); // 总时长（节拍）
  const [tempo, setTempo] = useState(120); // 速度（BPM）
  const [transpose, setTranspose] = useState(0); // 移调（半音）
  const [highlightDiatonic, setHighlightDiatonic] = useState(true); // 是否高亮调内音
  const [hoveringNoteId, setHoveringNoteId] = useState(null); // 鼠标悬停的音符ID
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖动
  const [previousBeat, setPreviousBeat] = useState(1); // 上一个节拍位置
  const [scaleDegreesToMidiNote, setScaleDegreesToMidiNote] = useState({}); // 音阶度数到 MIDI 音高映射
  const [audioContextInitialized, setAudioContextInitialized] = useState(false); // 新增状态跟踪AudioContext初始化

  // 音频相关状态
  const [audioContext, setAudioContext] = useState(null);
  const [audioBufferCache, setAudioBufferCache] = useState({});
  const activeAudioRefs = useRef({});
  const activeTimeouts = useRef([]);
  const audioInitialized = useRef(false); // 使用ref来跟踪初始化状态

  // DOM 引用
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // 更新 scaleDegreesToMidiNote 当 data.keys 变化时
  useEffect(() => {
    if (data && data.keys && data.keys.length > 0) {
      const key = data.keys[0];
      setScaleDegreesToMidiNote(generateScaleDegreesToMidiNote(key.tonic, key.scale));
    } else {
      setScaleDegreesToMidiNote(generateScaleDegreesToMidiNote("C", "major"));
    }
  }, [data]);

  // 确保页面加载时初始化AudioContext
  useEffect(() => {
    // 创建一个函数来处理AudioContext的创建
    const createAudioContext = () => {
      if (audioInitialized.current) return; // 防止重复初始化
      
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const newContext = new AudioContextClass();
          setAudioContext(newContext);
          audioInitialized.current = true;
          setAudioContextInitialized(true);
          console.log("AudioContext初始化成功:", newContext.state);
          
          // 用户交互时尝试自动恢复
          if (newContext.state === 'suspended') {
            console.log("AudioContext处于suspended状态，尝试恢复...");
            const resumeAudioContext = () => {
              newContext.resume().then(() => {
                console.log("AudioContext成功恢复!");
                window.removeEventListener('click', resumeAudioContext);
                window.removeEventListener('touchstart', resumeAudioContext);
                window.removeEventListener('keydown', resumeAudioContext);
              }).catch(err => {
                console.error("恢复AudioContext失败:", err);
              });
            };
            
            window.addEventListener('click', resumeAudioContext);
            window.addEventListener('touchstart', resumeAudioContext);
            window.addEventListener('keydown', resumeAudioContext);
          }
        }
      } catch (err) {
        console.error("创建AudioContext失败:", err);
      }
    };
    
    // 页面加载后立即尝试创建
    if (typeof window !== 'undefined' && !audioInitialized.current) {
      window.addEventListener('DOMContentLoaded', createAudioContext);
      
      // 添加点击事件监听器以响应用户交互
      const handleFirstInteraction = () => {
        createAudioContext();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
      
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);
      window.addEventListener('keydown', handleFirstInteraction);
      
      return () => {
        window.removeEventListener('DOMContentLoaded', createAudioContext);
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
    }
  }, []);

  // 确保MIDI对象存在
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.MIDI = MIDI || {};
      if (!window.MIDI.Soundfont) {
        window.MIDI.Soundfont = {};
      }
    }
  }, []);

  // 加载音频缓冲区函数
  const loadAudioBuffer = async (midiPitch) => {
    if (!audioContext) {
      console.warn("加载音频失败: AudioContext不可用");
      return null;
    }
    
    // 检查缓存
    if (audioBufferCache[midiPitch]) {
      return audioBufferCache[midiPitch];
    }
    
    try {
      const noteKey = midiToSoundfontKey(midiPitch);
      
      if (!window.MIDI?.Soundfont?.acoustic_grand_piano) {
        console.error("MIDI.Soundfont.acoustic_grand_piano 未定义");
        return null;
      }
      
      let dataUrl = window.MIDI.Soundfont.acoustic_grand_piano[noteKey];
      
      if (!dataUrl) {
        console.warn(`找不到音符 ${noteKey} (MIDI: ${midiPitch}) 的 Soundfont`);
        const keyVariations = generateKeyNameVariations(midiPitch);
        
        for (const keyVar of keyVariations) {
          if (window.MIDI.Soundfont.acoustic_grand_piano[keyVar]) {
            console.log(`找到替代键名: ${keyVar} for MIDI: ${midiPitch}`);
            dataUrl = window.MIDI.Soundfont.acoustic_grand_piano[keyVar];
            break;
          }
        }
        
        if (!dataUrl) {
          const nearestNote = findNearestAvailableNote(midiPitch);
          if (nearestNote && nearestNote !== midiPitch) {
            console.log(`使用最近的可用音符: ${midiToSoundfontKey(nearestNote)}`);
            return loadAudioBuffer(nearestNote);
          }
          
          console.error(`找不到 MIDI 音高 ${midiPitch} 的任何音源`);
          return null;
        }
      }
      
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setAudioBufferCache(prev => ({ ...prev, [midiPitch]: buffer }));
      return buffer;
    } catch (error) {
      console.error(`加载 MIDI 音符 ${midiPitch} 的音频失败:`, error);
      return null;
    }
  };

  // 查找最近的可用音符
  const findNearestAvailableNote = (midiPitch) => {
    if (!window.MIDI?.Soundfont?.acoustic_grand_piano) return null;
    
    for (let distance = 1; distance <= 12; distance++) {
      const lowerPitch = midiPitch - distance;
      const lowerKey = midiToSoundfontKey(lowerPitch);
      if (window.MIDI.Soundfont.acoustic_grand_piano[lowerKey]) {
        return lowerPitch;
      }
      
      const higherPitch = midiPitch + distance;
      const higherKey = midiToSoundfontKey(higherPitch);
      if (window.MIDI.Soundfont.acoustic_grand_piano[higherKey]) {
        return higherPitch;
      }
    }
    
    return null;
  };

  // 确保AudioContext可用且活动
  const ensureAudioContext = async () => {
    if (!audioContext) {
      // 尝试创建新的AudioContext
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const newContext = new AudioContextClass();
          setAudioContext(newContext);
          audioInitialized.current = true;
          setAudioContextInitialized(true);
          console.log("新创建的AudioContext状态:", newContext.state);
          return newContext;
        } else {
          console.error("浏览器不支持AudioContext");
          return null;
        }
      } catch (error) {
        console.error("创建AudioContext失败:", error);
        return null;
      }
    } else if (audioContext.state === 'suspended') {
      // 尝试恢复已暂停的AudioContext
      try {
        await audioContext.resume();
        console.log("AudioContext已恢复:", audioContext.state);
        return audioContext;
      } catch (error) {
        console.error("恢复AudioContext失败:", error);
        return null;
      }
    }
    
    return audioContext;
  };

  // 播放单个音符
  const playNote = async (midiPitch, duration = 0.5) => {
    const ctx = await ensureAudioContext();
    if (!ctx) {
      console.error("无法播放音符: AudioContext不可用");
      return;
    }
    
    try {
      const buffer = await loadAudioBuffer(midiPitch);
      if (!buffer) {
        console.warn(`无法加载音符 ${midiPitch} 的音频缓冲区`);
        return;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const delayNode = ctx.createDelay(2.0);
      delayNode.delayTime.value = 0.1;
      
      const mainGainNode = ctx.createGain();
      const reverbGainNode = ctx.createGain();
      
      mainGainNode.gain.value = 0.9;
      reverbGainNode.gain.value = 0.2;
      
      source.connect(mainGainNode);
      mainGainNode.connect(ctx.destination);
      
      source.connect(delayNode);
      delayNode.connect(reverbGainNode);
      reverbGainNode.connect(ctx.destination);
      
      activeAudioRefs.current[midiPitch] = {
        source,
        gainNode: mainGainNode,
        startTime: ctx.currentTime
      };
      
      const baseReleaseDuration = Math.max(2.0, duration * 3);
      const pitchFactor = Math.max(0.5, 1.0 - (midiPitch - 48) / 60);
      const releaseDuration = baseReleaseDuration * pitchFactor;
      
      mainGainNode.gain.setValueAtTime(0.9, ctx.currentTime);
      mainGainNode.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.1);
      mainGainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + releaseDuration);
      
      source.start(0);
      source.stop(ctx.currentTime + releaseDuration + 0.5);
      
      const noteElements = document.querySelectorAll(`[data-midi-pitch="${midiPitch}"]`);
      noteElements.forEach(el => {
        el.classList.add('note-playing');
        setTimeout(() => {
          el.classList.remove('note-playing');
        }, duration * 1000);
      });
      
      source.onended = () => {
        if (activeAudioRefs.current[midiPitch]) {
          delete activeAudioRefs.current[midiPitch];
        }
      };
      
      return true; // 表示音符播放成功
    } catch (error) {
      console.error(`播放音符 ${midiPitch} 出错:`, error);
      return false;
    }
  };

  // 播放和弦
  const playChord = async (chord) => {
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    
    // 获取调性
    const key = data.keys && data.keys.length > 0 ? data.keys[0] : { scale: "major", tonic: "C" };
    
    // 根据调性确定根音的MIDI音高
    const noteToMidiBase = {
      "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
      "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68,
      "Ab": 68, "A": 69, "A#": 70, "Bb": 70, "B": 71
    };
    
    const tonicMidi = noteToMidiBase[key.tonic] || 60;
    const rootMidi = tonicMidi + (chord.root - 1); // 根据和弦的根音数字确定MIDI音高
    
    let notes = [rootMidi];
    
    // 根据和弦类型添加其他音符
    switch(chord.type) {
      case 5: // 大三和弦
        notes.push(rootMidi + 4, rootMidi + 7);
        break;
      case 3: // 小三和弦
        notes.push(rootMidi + 3, rootMidi + 7);
        break;
      case 7: // 属七和弦
        notes.push(rootMidi + 4, rootMidi + 7, rootMidi + 10);
        break;
      case 8: // 大七和弦
        notes.push(rootMidi + 4, rootMidi + 7, rootMidi + 11);
        break;
      case 9: // 小七和弦
        notes.push(rootMidi + 3, rootMidi + 7, rootMidi + 10);
        break;
      case 2: // 减三和弦
        notes.push(rootMidi + 3, rootMidi + 6);
        break;
      case 4: // 增三和弦
        notes.push(rootMidi + 4, rootMidi + 8);
        break;
      default:
        notes.push(rootMidi + 4, rootMidi + 7); // 默认为大三和弦
    }
    
    // 依次播放和弦内的音符，稍微错开时间以更自然
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      setTimeout(() => {
        const baseDuration = 2.5;
        const pitchFactor = Math.max(0.5, 1.0 - (note - 48) / 60);
        const noteDuration = baseDuration * pitchFactor;
        playNote(note, noteDuration);
      }, i * 30);
    }
  };

  // 停止所有音符
  const stopAllNotes = () => {
    if (!audioContext) return;
    
    Object.values(activeAudioRefs.current).forEach(({ source, gainNode }) => {
      try {
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value || 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        setTimeout(() => {
          try {
            source.stop();
          } catch (e) {
            // 忽略已停止的音源错误
          }
        }, 150);
      } catch (e) {
        // 忽略错误
      }
    });
    
    // 清空活动音源引用
    setTimeout(() => {
      activeAudioRefs.current = {};
    }, 200);
  };

  // 计算总时长
  useEffect(() => {
    if (!data) return;
    
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
    
    if (data.tempos && data.tempos.length > 0) {
      setTempo(data.tempos[0].bpm);
    }
  }, [data]);

  // 处理容器点击
  const handleContainerClick = (e) => {
    if (!containerRef.current || isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const containerX = e.clientX - rect.left;
    const totalX = containerX + containerRef.current.scrollLeft;
    const newBeat = Math.max(1, Math.min(duration, totalX / pixelsPerBeat + 1));
    
    if (playing) {
      startTimeRef.current = performance.now() - ((newBeat - 1) * (60000 / tempo));
    }
    
    setCurrentBeat(newBeat);
    
    if (!playing && containerRef.current) {
      updateScrollPosition(newBeat);
    }
  };

  // 更新滚动位置
  const updateScrollPosition = (beat) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const x = (beat - 1) * pixelsPerBeat;
    const viewCenterX = containerWidth / 3;
    container.scrollLeft = Math.max(0, x - viewCenterX);
  };

  // 清除所有超时
  const clearAllTimeouts = () => {
    activeTimeouts.current.forEach(id => clearTimeout(id));
    activeTimeouts.current = [];
  };

  // 安排音符和和弦播放
  const scheduleNotes = (ctx, startBeat) => {
    if (!ctx || !data) return;
    
    const msPerBeat = 60000 / tempo;
    
    // 安排音符播放
    if (data.notes && data.notes.length > 0) {
      data.notes.forEach(note => {
        if (note.isRest) return;
        
        // 只安排从当前位置开始或未来的音符
        if (note.beat >= startBeat) {
          // 计算相对延迟时间
          const noteDelay = (note.beat - startBeat) * msPerBeat;
          
          // 计算MIDI音高
          let midiPitch;
          if (note.sd in scaleDegreesToMidiNote) {
            midiPitch = scaleDegreesToMidiNote[note.sd] + (note.octave * 12) + transpose;
          } else {
            midiPitch = 60 + (note.octave * 12) + transpose;
          }
          
          // 延迟播放
          const timeoutId = setTimeout(() => {
            const noteDurationSec = note.duration / (tempo / 60);
            playNote(midiPitch, noteDurationSec);
          }, noteDelay);
          
          activeTimeouts.current.push(timeoutId);
        }
      });
    }
    
    // 安排和弦播放
    if (data.chords && data.chords.length > 0) {
      data.chords.forEach(chord => {
        if (chord.beat >= startBeat) {
          const chordDelay = (chord.beat - startBeat) * msPerBeat;
          
          const timeoutId = setTimeout(() => {
            playChord(chord);
          }, chordDelay);
          
          activeTimeouts.current.push(timeoutId);
        }
      });
    }
  };

  // 开始播放 - 完全重写
  const startPlayback = async () => {
    console.log("尝试开始播放...");
    if (playing) return;
    
    // 尝试初始化或恢复 AudioContext
    const ctx = await ensureAudioContext();
    if (!ctx) {
      console.error("无法开始播放: AudioContext不可用");
      // 尝试播放一个静音的AudioContext来解锁
      try {
        const silenceBuffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = silenceBuffer;
        source.connect(ctx.destination);
        source.start(0);
        source.stop(0.001);
        console.log("尝试播放静音音频以解锁AudioContext");
      } catch (e) {
        console.error("静音解锁失败:", e);
      }
      return;
    }
    
    // 播放前清理
    clearAllTimeouts();
    stopAllNotes();
    
    // 设置播放状态
    setPlaying(true);
    
    // 调整开始时间考虑当前播放位置
    const msPerBeat = 60000 / tempo;
    startTimeRef.current = performance.now() - ((currentBeat - 1) * msPerBeat);
    
    // 输出调试信息
    console.log("播放开始:", {
      currentBeat,
      msPerBeat,
      startTime: startTimeRef.current,
      audioContext: ctx.state
    });
    
    // 安排音符播放
    scheduleNotes(ctx, currentBeat);
    
    // 更新播放头动画
    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - ((currentBeat - 1) * msPerBeat);
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const newBeat = 1 + (elapsed / msPerBeat);
      
      if (newBeat > duration) {
        // 播放结束
        console.log("播放完成");
        stopPlayback();
        setCurrentBeat(1);
        if (containerRef.current) {
          containerRef.current.scrollLeft = 0;
        }
        return;
      }
      
      setCurrentBeat(newBeat);
      
      // 自动滚动
      if (autoScroll) {
        updateScrollPosition(newBeat);
      }
      
      // 继续动画
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // 启动动画
    animationRef.current = requestAnimationFrame(animate);
    
    // 测试播放一个音符以确认音频可以工作
    if (data.notes && data.notes.length > 0) {
      // 找一个即将播放的音符进行测试
      const testNote = data.notes.find(note => note.beat >= currentBeat && !note.isRest);
      if (testNote) {
        const midiPitch = scaleDegreesToMidiNote[testNote.sd] + (testNote.octave * 12) + transpose;
        console.log("测试播放音符:", midiPitch);
        playNote(midiPitch, 0.2).then(success => {
          console.log("测试音符播放" + (success ? "成功" : "失败"));
        });
      }
    }
  };

  // 停止播放
  const stopPlayback = () => {
    console.log("停止播放");
    if (!playing) return;
    
    // 取消动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // 清除所有延时
    clearAllTimeouts();
    
    // 停止所有音符
    stopAllNotes();
    
    // 更新状态
    setPlaying(false);
  };

  // 重置播放
  const resetPlayback = () => {
    stopPlayback();
    setCurrentBeat(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  };

  // 处理播放状态变化
  useEffect(() => {
    console.log("播放状态变化:", playing);
  }, [playing]);

  // 处理滑块变化
  const handleSeek = (_, newValue) => {
    if (playing) {
      startTimeRef.current = performance.now() - ((newValue - 1) * (60000 / tempo));
    }
    
    setCurrentBeat(newValue);
    updateScrollPosition(newValue);
  };

  // 调整八度
  const handleTranspose = (_, value) => {
    setTranspose(value);
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      clearAllTimeouts();
      stopAllNotes();
      
      if (audioContext) {
        audioContext.close().catch(err => {
          console.error("关闭AudioContext出错:", err);
        });
      }
    };
  }, [audioContext]);

  // 数据变化时重置
  useEffect(() => {
    resetPlayback();
  }, [data]);

  // 调试函数
  const debugPlayback = () => {
    console.log({
      audioContext: audioContext?.state,
      audioInitialized: audioInitialized.current,
      playing,
      currentBeat,
      timeouts: activeTimeouts.current.length,
      activeAudio: Object.keys(activeAudioRefs.current).length
    });
    
    // 测试音频功能
    ensureAudioContext().then(ctx => {
      if (ctx) {
        console.log("AudioContext可用:", ctx.state);
        // 播放测试音符
        playNote(60, 0.3).then(success => {
          console.log("测试音符播放" + (success ? "成功" : "失败"));
        });
      } else {
        console.error("AudioContext不可用");
      }
    });
  };

  // 渲染钢琴卷帘视图
  const renderPianoRoll = () => {
    if (!data) return null;

    // 获取调性
    const key = data.keys && data.keys.length > 0 ? data.keys[0] : { scale: "major", tonic: "C" };

    // 动态设置音高范围，基于主音
    const noteToMidiBase = {
      "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
      "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68,
      "Ab": 68, "A": 69, "A#": 70, "Bb": 70, "B": 71
    };
    const tonicMidi = noteToMidiBase[key.tonic] || 60; // 例如 B4 = 71
    const minPitch = tonicMidi - 12; // 例如 B3 = 59
    const maxPitch = tonicMidi + 24; // 例如 B6 = 95

    const totalWidth = Math.max(width, duration * pixelsPerBeat);

    // 获取调内音符
    const getDiatonicNotesForKey = (tonic) => {
      const keyToOffset = {
        "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
        "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
        "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
      };
      const offset = keyToOffset[tonic] || 0;
      const majorScale = [0, 2, 4, 5, 7, 9, 11];
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

    // 渲染音符
    const renderNotes = () => {
      if (!data.notes || data.notes.length === 0) return null;

      return data.notes.map((note, index) => {
        // 为休止符分配最低音高（视觉占位）
        let midiPitch = note.isRest ? minPitch : (scaleDegreesToMidiNote[note.sd] || 60) + (note.octave * 12) + transpose;
        if (midiPitch < minPitch || midiPitch > maxPitch) return null;

        const x = (note.beat - 1) * pixelsPerBeat;
        const y = height - ((midiPitch - minPitch + 1) * noteHeight);
        const width = note.duration * pixelsPerBeat;

        const isDiatonic = note.isRest ? false : diatonicNotes.includes(midiPitch);
        const isActive = currentBeat >= note.beat && currentBeat < note.beat + note.duration;

        // 休止符使用虚线边框和半透明背景
        const backgroundColor = note.isRest
          ? 'rgba(128, 128, 128, 0.3)'
          : (isActive ? 'rgba(255, 0, 0, 0.8)' : (highlightDiatonic && isDiatonic ? 'rgba(64, 128, 255, 0.8)' : 'rgba(128, 128, 128, 0.8)'));

        const border = note.isRest
          ? '1px dashed rgba(0, 0, 0, 0.5)'
          : (isActive ? '2px solid red' : '1px solid rgba(0, 0, 0, 0.3)');

        return (
          <Box
            key={`note-${index}`}
            data-midi-pitch={midiPitch}
            data-note-id={index}
            sx={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${noteHeight}px`,
              backgroundColor,
              borderRadius: '3px',
              border,
              zIndex: isActive ? 2 : 1,
              transition: 'background-color 0.1s',
              cursor: note.isRest ? 'default' : 'pointer',
              '&:hover': {
                filter: note.isRest ? 'none' : 'brightness(1.2)',
              },
              '&.note-playing': {
                boxShadow: note.isRest ? 'none' : '0 0 8px rgba(255, 255, 0, 0.8)',
                filter: note.isRest ? 'none' : 'brightness(1.5)',
              }
            }}
            onClick={note.isRest ? null : () => playNote(midiPitch, note.duration / (tempo / 60))}
            title={`音符: ${note.isRest ? '休止符' : note.sd}, 八度: ${note.octave}, 时值: ${note.duration}, MIDI: ${midiPitch}`}
          >
            {showNoteNames && width >= 20 && !note.isRest && (
              <Typography
                variant="caption"
                sx={{
                  color: 'white',
                  fontSize: '0.6rem', // 减小字体以适应音符名称
                  textShadow: '0px 0px 2px black',
                  position: 'absolute',
                  top: '1px',
                  left: '2px'
                }}
              >
                {midiToNoteName(midiPitch)}
              </Typography>
            )}
            {showNoteNames && width >= 20 && note.isRest && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(0, 0, 0, 0.5)',
                  fontSize: '0.6rem',
                  textShadow: '0px 0px 2px white',
                  position: 'absolute',
                  top: '1px',
                  left: '2px'
                }}
              >
                R
              </Typography>
            )}
          </Box>
        );
      });
    };

    // 渲染和弦
    const renderChords = () => {
      if (!showChords || !data.chords || data.chords.length === 0) return null;

      const rootToNoteName = generateRootToNoteName(key.tonic);

      return data.chords.map((chord, index) => {
        const x = (chord.beat - 1) * pixelsPerBeat;
        const width = chord.duration * pixelsPerBeat;

        const rootName = rootToNoteName[chord.root] || '';
        const chordType = chordTypeMap[chord.type] || '';
        const chordName = `${rootName}${chordType}`;

        const isActive = currentBeat >= chord.beat && currentBeat < chord.beat + chord.duration;

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
              boxShadow: isActive ? '0 0 5px rgba(255, 200, 0, 0.5)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              playChord(chord);
              setCurrentBeat(chord.beat);
              updateScrollPosition(chord.beat);
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

    // 渲染小节线
    const renderMeasureLines = () => {
      if (!data.meters || data.meters.length === 0) return null;

      const meter = data.meters[0];
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

    // 渲染段落
    const renderSections = () => {
      if (!showSections || !data.sections || data.sections.length === 0) return null;

      return data.sections.map((section, index) => {
        const x = (section.beat - 1) * pixelsPerBeat;
        const nextSectionBeat = index < data.sections.length - 1
          ? data.sections[index + 1].beat
          : duration + 1;
        const width = (nextSectionBeat - section.beat) * pixelsPerBeat;

        const getSectionColor = (name) => {
          const colorMap = {
            'Intro': 'rgba(144, 238, 144, 0.3)',
            'Verse': 'rgba(173, 216, 230, 0.3)',
            'Chorus': 'rgba(255, 182, 193, 0.3)',
            'Bridge': 'rgba(255, 222, 173, 0.3)',
            'Outro': 'rgba(216, 191, 216, 0.3)',
            'Pre': 'rgba(255, 255, 173, 0.3)',
          };

          for (const key of Object.keys(colorMap)) {
            if (name.includes(key)) {
              return colorMap[key];
            }
          }

          return 'rgba(200, 200, 200, 0.3)';
        };

        return (
          <React.Fragment key={`section-${index}`}>
            <Box
              sx={{
                position: 'absolute',
                left: `${x}px`,
                top: '25px',
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

    // 渲染钢琴键盘
    const renderPianoKeys = () => {
      const keys = [];
      const totalKeys = maxPitch - minPitch + 1;

      for (let i = 0; i < totalKeys; i++) {
        const pitch = minPitch + i;
        const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
        const y = height - ((pitch - minPitch + 1) * noteHeight);

        const showNoteName = pitch % 12 === 0;
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
              zIndex: 1,
              cursor: 'pointer'
            }}
            onClick={() => playNote(pitch, 0.5)}
            title={`音符: ${midiToNoteName(pitch)}`}
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

        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            marginLeft: '40px',
            width: `${width}px`,
            height: `${height}px`,
            overflowX: 'auto',
            overflowY: 'hidden',
            backgroundColor: '#f8f8f8',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          onClick={handleContainerClick}
        >
          <Box
            ref={contentRef}
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
          </Box>
        </Box>
      </Box>
    );
  };

  // 播放按钮点击处理
  const handlePlayClick = () => {
    console.log("播放按钮点击");
    debugPlayback();
    
    if (playing) {
      stopPlayback();
    } else {
      // 确保有音频上下文，然后开始播放
      ensureAudioContext().then(() => {
        startPlayback();
      });
    }
  };

  if (!data) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>无 MIDI 数据</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ marginLeft: 5 }}>
        MIDI 钢琴卷帘视图 {playing ? "(播放中)" : ""}
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginLeft: 5 }}>
        <Box sx={{ mr: 2 }}>
          <Button
            variant="contained"
            color={playing ? "error" : "primary"}
            onClick={handlePlayClick} // 使用更新后的处理函数
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

      <Box sx={{ position: 'relative', ml: '40px', mb: 0.5, height: '16px', width: `${width}px`, overflowX: 'auto', marginLeft: 5 }}>
        <Box sx={{ position: 'relative', width: `${Math.max(width, duration * pixelsPerBeat)}px`, height: '100%' }}>
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <React.Fragment key={`time-${i + 1}`}>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${i * pixelsPerBeat}px`,
                  top: '0',
                  width: '1px',
                  height: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: `${i * pixelsPerBeat + 3}px`,
                  top: '0',
                  fontSize: '0.7rem',
                  color: 'rgba(0, 0, 0, 0.6)'
                }}
              >
                {i + 1}
              </Typography>
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', marginLeft: 5 }}>
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

      {renderPianoRoll()}

    </Paper>
  );
};

// 初始化 MIDI 结构
if (typeof window !== 'undefined') {
  if (typeof window.MIDI === 'undefined') window.MIDI = {};
  if (typeof window.MIDI.Soundfont === 'undefined') window.MIDI.Soundfont = {};
}

export default PianoRollVisualizer;
      