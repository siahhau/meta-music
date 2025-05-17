'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Skeleton,
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import MusicPlayer from './MusicPlayer'; // Import the new component

export default function ScoreDisplay({ spotifyId }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取乐谱数据
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/tracks/spotify/${spotifyId}/scores`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setScoreData(res.data.score_data || {});
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchScore();
  }, [spotifyId]);

  // 处理和弦名称
  const rootNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const getChordName = (chord) => {
    if (!chord || !chord.root || chord.root < 1 || chord.root > 12) return 'Unknown';
    const rootName = rootNames[chord.root - 1];
    const suffix = chord.type === 5 ? '' : chord.type === 3 ? 'm' : '';
    const suspension = chord.suspensions && chord.suspensions.length > 0 ? `sus${chord.suspensions[0]}` : '';
    return `${rootName}${suffix}${suspension}`;
  };

  // 根据 octave 格式化音符显示
  const formatNoteDisplay = (note) => {
    console.log('Note:', note);
    if (typeof note.octave !== 'number') return note.sd;
    switch (note.octave) {
      case -2:
        return `${note.sd}..`;
      case -1:
        return `${note.sd}.`;
      case 0:
        return note.sd;
      case 1:
        return <span>{note.sd}<sup>˙</sup></span>;
      case 2:
        return <span>{note.sd}<sup>˙˙</sup></span>;
      default:
        return note.sd;
    }
  };

  // 处理 section、和弦、音符和歌词
  const chordsBySection = [];
  if (scoreData && scoreData.sections && scoreData.sections.length > 0 && scoreData.chords && scoreData.chords.length > 0) {
    const parsedChords = scoreData.chords
      .map(chord => ({
        ...chord,
        beat: typeof chord.beat === 'number' ? chord.beat : 0,
        duration: typeof chord.duration === 'number' ? chord.duration : ChordsBySection,
      }))
      .sort((a, b) => a.beat - b.beat);

    const parsedNotes = (scoreData.notes || [])
      .map(note => ({
        ...note,
        beat: typeof note.beat === 'number' ? note.beat : 0,
        duration: typeof note.duration === 'number' ? note.duration : 1,
        octave: typeof note.octave === 'number' ? note.octave : 0,
      }))
      .sort((a, b) => a.beat - b.beat);

    // 解析歌词并映射到音符
    const sectionLyrics = scoreData.lyrics?.sectionLyrics || [];
    const lyricMap = new Map();

    sectionLyrics.forEach(section => {
      const sectionName = section.sectionName;
      const lyricText = section.lyrics[0] || '';
      if (lyricText) {
        const lyricSegments = lyricText
          .split(/\s+/)
          .filter(segment => segment)
          .map(segment => segment.replace(/_[0-9]+_/g, '').trim());

        const sectionData = scoreData.sections.find(s => s.name === sectionName);
        if (!sectionData) return;

        const sectionStart = typeof sectionData.beat === 'number' ? sectionData.beat : 0;
        const sectionNotes = parsedNotes.filter(
          note => note.beat >= sectionStart && note.beat < (scoreData.sections[scoreData.sections.indexOf(sectionData) + 1]?.beat || Infinity)
        );

        lyricSegments.forEach((segment, index) => {
          if (index < sectionNotes.length) {
            const note = sectionNotes[index];
            lyricMap.set(note.beat, segment);
          } else {
            const lastNote = sectionNotes[sectionNotes.length - 1];
            if (lastNote) {
              lyricMap.set(lastNote.beat + index * 0.1, segment);
            }
          }
        });
      }
    });

    // 按 section 分组
    let currentSectionIndex = 0;
    for (const section of scoreData.sections) {
      const sectionStart = typeof section.beat === 'number' ? section.beat : 0;
      const nextSection = scoreData.sections[currentSectionIndex + 1];
      const sectionEnd = nextSection && typeof nextSection.beat === 'number' ? nextSection.beat : Infinity;

      const sectionChords = parsedChords
        .filter(chord => chord.beat >= sectionStart && chord.beat < sectionEnd)
        .map(chord => ({
          name: getChordName(chord),
          beat: chord.beat,
          duration: chord.duration,
        }));

      const sectionNotes = parsedNotes
        .filter(note => note.beat >= sectionStart && note.beat < sectionEnd)
        .map(note => ({
          sd: note.sd,
          beat: note.beat,
          duration: note.duration,
          octave: note.octave,
        }));

      const sectionLyrics = parsedNotes
        .filter(note => note.beat >= sectionStart && note.beat < sectionEnd)
        .map(note => ({
          beat: note.beat,
          text: lyricMap.get(note.beat) || '',
          note: note.sd,
        }))
        .filter(lyric => lyric.text);

      const additionalLyrics = Array.from(lyricMap.entries())
        .filter(([beat, text]) => beat >= sectionStart && beat < sectionEnd && !sectionLyrics.some(lyric => lyric.beat === beat))
        .map(([beat, text]) => ({
          beat,
          text,
          note: 'N/A',
        }));

      // 计算最大节拍数，添加默认值
      const chordBeats = sectionChords.length > 0 ? sectionChords.map(c => c.beat + c.duration) : [0];
      const noteBeats = sectionNotes.length > 0 ? sectionNotes.map(n => n.beat + n.duration) : [0];
      const lyricBeats = [...sectionLyrics, ...additionalLyrics].length > 0
        ? [...sectionLyrics, ...additionalLyrics].map(l => l.beat + 0.25)
        : [0];
      const sectionLength = sectionEnd === Infinity || sectionEnd <= sectionStart ? 1 : sectionEnd - sectionStart;

      const maxBeat = Math.max(...chordBeats, ...noteBeats, ...lyricBeats, sectionLength);
      const beatResolution = 0.25;
      const totalColumns = Math.max(1, Math.ceil(maxBeat / beatResolution));

      chordsBySection.push({
        name: section.name,
        chords: sectionChords,
        notes: sectionNotes,
        lyrics: [...sectionLyrics, ...additionalLyrics].sort((a, b) => a.beat - b.beat),
        totalColumns,
        beatResolution,
        startBeat: sectionStart,
      });

      currentSectionIndex++;
    }
  }

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <Skeleton variant="text" width={100} />
        </Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: 'auto', minWidth: '100%' }}>
            <TableBody>
              <TableRow>

                <TableCell
                >
                  <Skeleton variant="rectangular" height={32} />
                </TableCell>

              </TableRow>
              <TableRow>
                <TableCell
                >
                  <Skeleton variant="rectangular"  height={20} />
                </TableCell>

              </TableRow>
              <TableRow>
                <TableCell
                >
                  <Skeleton variant="rectangular" height={20} />
                </TableCell>

              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="body2" color="error">加载简谱失败: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>简谱：</strong>
      </Typography>
      {chordsBySection.length > 0 ? (
        <>
          {chordsBySection.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
                {section.name}
              </Typography>
              <TableContainer>
                <Table sx={{ tableLayout: 'fixed', width: 'auto', minWidth: '100%' }}>
                  <TableBody>
                    <TableRow>
                      {Array.from({ length: section.totalColumns }).map((_, colIndex) => {
                        const beat = section.startBeat + colIndex * section.beatResolution;
                        const chord = section.chords.find(
                          chord => Math.abs(chord.beat - beat) < section.beatResolution / 2
                        );
                        if (chord && Math.abs(chord.beat - beat) < section.beatResolution / 2) {
                          const colSpan = Math.max(1, Math.ceil(chord.duration / section.beatResolution));
                          return (
                            <TableCell
                              key={colIndex}
                              colSpan={colSpan}
                              sx={{
                                minWidth: `${40 * colSpan}px`,
                                p: 0.5,
                                textAlign: 'left',
                              }}
                            >
                              <Chip
                                label={chord.name}
                                variant="filled"
                                color="default"
                                sx={{
                                  fontSize: '0.875rem',
                                  borderRadius: '8px',
                                  bgcolor: 'blue.200',
                                  width: '40px',
                                  display: 'inline-block',
                                  textAlign: 'center',
                                  height: '32px',
                                  lineHeight: '32px',
                                }}
                              />
                            </TableCell>
                          );
                        }
                        if (!chord) {
                          return (
                            <TableCell
                              key={colIndex}
                              sx={{
                                minWidth: '40px',
                                p: 0.5,
                                textAlign: 'left',
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </TableRow>
                    <TableRow>
                      {Array.from({ length: section.totalColumns }).map((_, colIndex) => {
                        const beat = section.startBeat + colIndex * section.beatResolution;
                        const note = section.notes.find(
                          note => Math.abs(note.beat - beat) < section.beatResolution / 2
                        );
                        return (
                          <TableCell
                            key={colIndex}
                            sx={{
                              minWidth: '40px',
                              p: 0.5,
                              textAlign: 'center',
                            }}
                          >
                            {note ? (
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {formatNoteDisplay(note)}
                              </Typography>
                            ) : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      {Array.from({ length: section.totalColumns }).map((_, colIndex) => {
                        const beat = section.startBeat + colIndex * section.beatResolution;
                        const lyric = section.lyrics.find(
                          lyric => Math.abs(lyric.beat - beat) < section.beatResolution / 2
                        );
                        return (
                          <TableCell
                            key={colIndex}
                            sx={{
                              minWidth: '40px',
                              p: 0.5,
                              textAlign: 'center',
                            }}
                          >
                            {lyric ? (
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {lyric.text}
                              </Typography>
                            ) : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
          {/* Add MusicPlayer component */}
          <MusicPlayer scoreData={scoreData} />
        </>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          无简谱数据
        </Typography>
      )}
    </Box>
  );
}