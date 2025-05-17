// frontend/src/components/ScoreDisplay.jsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Chip } from '@mui/material';

export default function ScoreDisplay({ spotifyId }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 异步请求乐谱数据
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/tracks/spotify/${spotifyId}/scores`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log(res)
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

  // 按 sections 分组和弦和歌词
  const chordsBySection = [];
  if (scoreData && scoreData.sections && scoreData.sections.length > 0 && scoreData.chords && scoreData.chords.length > 0) {
    const parsedChords = scoreData.chords.map(chord => ({
      ...chord,
      beat: chord.beat || 0
    })).sort((a, b) => a.beat - b.beat);

    const parsedLyrics = (scoreData.lyrics[0] || []).map(lyric => ({
      ...lyric,
      beat: lyric.beat || 0
    })).sort((a, b) => a.beat - b.beat);

    let currentSectionIndex = 0;
    for (const section of scoreData.sections) {
      const sectionStart = section.beat || 0;
      const nextSection = scoreData.sections[currentSectionIndex + 1];
      const sectionEnd = nextSection ? nextSection.beat : Infinity;

      const sectionChords = parsedChords.filter(
        chord => chord.beat >= sectionStart && chord.beat < sectionEnd
      ).map(chord => getChordName(chord));

      const sectionLyrics = parsedLyrics.filter(
        lyric => lyric.beat >= sectionStart && lyric.beat < sectionEnd
      ).map(lyric => lyric.text);

      chordsBySection.push({
        name: section.name,
        chords: sectionChords,
        lyrics: sectionLyrics
      });

      currentSectionIndex++;
    }
  }

  if (loading) {
    return <Typography variant="body2">加载简谱中...</Typography>;
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
        <Box>
          {chordsBySection.map((section, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
                {section.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {section.chords.length > 0 ? (
                  section.chords.map((chord, chordIndex) => (
                    <Chip
                      key={chordIndex}
                      label={chord}
                      variant="filled"
                      color="default"
                      sx={{ fontSize: '0.875rem', borderRadius: '8px', bgcolor: 'grey.200' }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    无和弦
                  </Typography>
                )}
              </Box>
              <Box sx={{ pl: 2 }}>
                {section.lyrics.length > 0 ? (
                  section.lyrics.map((lyric, lyricIndex) => (
                    <Typography key={lyricIndex} variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
                      {lyric}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    无歌词
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          无简谱数据
        </Typography>
      )}
    </Box>
  );
}