import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const MusicPlayer = ({ scoreData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [pixelsPerBeat, setPixelsPerBeat] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [dragBeat, setDragBeat] = useState(null);
  const tableContainerRef = useRef(null);
  const synthRef = useRef(null);
  const polySynthRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Constants
  const bpm = scoreData?.tempos?.[0]?.bpm || 89;
  const beatToSeconds = 60 / bpm;
  const beatResolution = 0.25; // 0.25 beat per column
  const zoomStep = 5;
  const minPixelsPerBeat = 10;
  const maxPixelsPerBeat = 50;
  const midiRange = { min: 60, max: 83 }; // C4 to B5

  // Initialize Tone.js synths
  useEffect(() => {
    polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
    }).toDestination();
    synthRef.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
    }).toDestination();
    setIsLoading(false);

    return () => {
      polySynthRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  // Map root to MIDI note (C major scale, root: 1 = C)
  const rootToMidi = (root, baseOctave = 4) => {
    const cMajorScale = [0, 2, 4, 5, 7, 9, 11];
    const index = (root - 1) % 12;
    const octaveOffset = Math.floor((root - 1) / 12);
    const noteIndex = index < 7 ? index : index - 7;
    return 60 + cMajorScale[noteIndex] + (octaveOffset * 12);
  };

  // Map scale degree (sd) and octave to MIDI note
  const sdToMidi = (sd, octave, baseOctave = 4) => {
    const cMajorScale = [0, 2, 4, 5, 7, 9, 11];
    const noteIndex = (parseInt(sd) - 1) % 7;
    return 60 + cMajorScale[noteIndex] + (octave * 12);
  };

  // Get chord notes (major triad)
  const getChordNotes = (root, type) => {
    const rootMidi = rootToMidi(root);
    if (type === 5) {
      return [rootMidi, rootMidi + 4, rootMidi + 7];
    }
    return [rootMidi];
  };

  // Get chord name for display
  const getChordName = (chord) => {
    const rootNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (!chord || !chord.root || chord.root < 1 || chord.root > 12) return '';
    const rootName = rootNames[chord.root - 1];
    const suffix = chord.type === 5 ? '' : chord.type === 3 ? 'm' : '';
    return `${rootName}${suffix}`;
  };

  // Calculate table dimensions
  const maxBeat = scoreData
    ? Math.max(
        ...(scoreData.chords?.map(c => c.beat + c.duration) || [0]),
        ...(scoreData.notes?.map(n => n.beat + n.duration) || [0])
      )
    : 0;
  const totalColumns = Math.max(1, Math.ceil(maxBeat / beatResolution));
  const midiRows = Array.from({ length: midiRange.max - midiRange.min + 1 }, (_, i) => midiRange.max - i);

  // Schedule playback
  const schedulePlayback = () => {
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    scoreData?.chords?.forEach(chord => {
      if (!chord.isRest) {
        const startTime = chord.beat * beatToSeconds;
        const duration = chord.duration * beatToSeconds;
        const notes = getChordNotes(chord.root, chord.type).map(midi => Tone.Midi(midi).toNote());
        Tone.Transport.schedule(time => {
          polySynthRef.current?.triggerAttackRelease(notes, duration, time);
        }, startTime);
      }
    });

    scoreData?.notes?.forEach(note => {
      if (!note.isRest) {
        const startTime = note.beat * beatToSeconds;
        const duration = note.duration * beatToSeconds;
        const midi = sdToMidi(note.sd, note.octave);
        const noteName = Tone.Midi(midi).toNote();
        Tone.Transport.schedule(time => {
          synthRef.current?.triggerAttackRelease(noteName, duration, time);
        }, startTime);
      }
    });
  };

  // Update current time
  const updateTime = () => {
    if (isPlaying && !isDragging) {
      const newTime = Tone.Transport.seconds;
      setCurrentTime(newTime);
      // Auto-scroll
      const container = tableContainerRef.current;
      if (container) {
        const cursorBeat = newTime / beatToSeconds;
        const cursorCol = Math.floor(cursorBeat / beatResolution);
        const containerWidth = container.offsetWidth;
        const scrollLeft = container.scrollLeft;
        const cellWidth = pixelsPerBeat * beatResolution;
        const cursorX = cursorCol * cellWidth;
        const cursorVisibleStart = scrollLeft + containerWidth / 3;
        const cursorVisibleEnd = scrollLeft + (2 * containerWidth) / 3;

        if (cursorX < cursorVisibleStart || cursorX > cursorVisibleEnd) {
          container.scrollLeft = cursorX - containerWidth / 2;
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    await Tone.start();
    if (!isPlaying) {
      console.log('Starting playback');
      schedulePlayback();
      Tone.Transport.start();
      setIsPlaying(true);
      updateTime();
    } else {
      console.log('Pausing playback');
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setPixelsPerBeat(prev => Math.min(prev + zoomStep, maxPixelsPerBeat));
  };

  const handleZoomOut = () => {
    setPixelsPerBeat(prev => Math.max(prev - zoomStep, minPixelsPerBeat));
  };

  // Handle drag
  const handleMouseDown = (beat) => {
    setIsDragging(true);
    setDragBeat(beat);
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const handleMouseMove = (beat) => {
    if (isDragging) {
      setDragBeat(beat);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragBeat !== null) {
      const newTime = dragBeat * beatToSeconds;
      console.log('Drag released, new time:', newTime);
      Tone.Transport.seconds = newTime;
      setCurrentTime(newTime);
      setIsDragging(false);
      setDragBeat(null);
    }
  };

  // Add mouse event listeners
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, dragBeat]);

  // Generate table data
  const getCellContent = (midi, colBeat) => {
    // Check for notes
    const note = scoreData?.notes?.find(
      note => !note.isRest && Math.abs(note.beat - colBeat) < beatResolution / 2 && sdToMidi(note.sd, note.octave) === midi
    );
    if (note) {
      return { type: 'note', value: note.sd, style: { bgcolor: 'rgba(255, 0, 0, 0.7)', color: '#fff' } };
    }

    // Check for chords
    const chord = scoreData?.chords?.find(
      chord => !chord.isRest && chord.beat <= colBeat && colBeat < chord.beat + chord.duration && rootToMidi(chord.root) === midi
    );
    if (chord) {
      const isStart = Math.abs(chord.beat - colBeat) < beatResolution / 2;
      return {
        type: 'chord',
        value: isStart ? getChordName(chord) : '',
        style: { bgcolor: 'rgba(0, 128, 255, 0.5)', color: '#000' },
        colSpan: isStart ? Math.max(1, Math.ceil(chord.duration / beatResolution)) : null,
      };
    }

    return { type: 'empty', value: '', style: {} };
  };

  if (!scoreData) {
    return <Typography>无乐谱数据</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default MusicPlayer;