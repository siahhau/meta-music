"use client";
import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  Grid, 
  Paper,
  useTheme
} from '@mui/material';
import { useGetScoreData } from '../actions/score'; // Adjust path as needed

// 辅助函数：格式化和弦显示 - 使用音阶度数（罗马数字）表示和弦
const formatChord = (chord, key = { tonic: 'C', scale: 'major' }) => {
  if (!chord) return '?';
  
  // 罗马数字映射
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  
  // 获取和弦根音的罗马数字表示
  const getRomanNumeral = (scaleDegree) => {
    // 确保音阶度数在1-7范围内
    const normalizedDegree = ((scaleDegree - 1) % 7) + 1;
    let romanNumeral = romanNumerals[normalizedDegree - 1];
    
    // 根据和弦类型决定是否使用小写罗马数字
    if (chord.type === 5) {
      // 在大调中，ii, iii, vi是小三和弦
      if (key.scale === 'major' && [2, 3, 6].includes(normalizedDegree)) {
        romanNumeral = romanNumeral.toLowerCase();
      }
      // 在小调中，i, iv, v是小三和弦（简化处理）
      else if (key.scale === 'minor' && [1, 4, 5].includes(normalizedDegree)) {
        romanNumeral = romanNumeral.toLowerCase();
      }
    } else if (chord.type === 1 || chord.type === 13) {
      // 减三和弦使用小写
      romanNumeral = romanNumeral.toLowerCase();
    }
    
    return romanNumeral;
  };
  
  // 获取和弦类型标记
  const getChordQualitySymbol = (type) => {
    // 在实际应用中可能需要更详细的映射
    const typeMap = {
      1: '°',      // 减三和弦
      5: '',       // 大三和弦或小三和弦，已通过大小写处理
      7: '⁷',      // 属七和弦
      9: 'M⁷',     // 大七和弦
      11: '⁷',     // 小七和弦
      13: '°⁷'     // 减七和弦
    };
    return typeMap[type] || '';
  };
  
  // 构建和弦文本表示
  let chordText = getRomanNumeral(chord.root);
  
  // 添加和弦品质符号
  chordText += getChordQualitySymbol(chord.type);
  
  // 添加修饰音
  if (chord.adds && chord.adds.length > 0) {
    chordText += `add${chord.adds.join('')}`;
  }
  
  // 添加转位信息
  if (chord.inversion > 0) {
    // 转位标记方式：Ⅰ⁶ Ⅴ⁶₄ 等
    const inversionSymbols = ['', '⁶', '⁶₄'];
    const inversionSymbol = inversionSymbols[chord.inversion] || chord.inversion;
    chordText += inversionSymbol;
  }
  
  // 添加变化音
  if (chord.alterations && chord.alterations.length > 0) {
    chord.alterations.forEach(alt => {
      chordText += `(${alt})`;
    });
  }
  
  return chordText;
};

const ChordsBySection = ({ spotifyId }) => {
  const { scoreData, scoreLoading, scoreError } = useGetScoreData(spotifyId);
  const theme = useTheme();
  
  // 将和弦按段落分组
  const chordsBySection = useMemo(() => {
    if (!scoreData || !scoreData.chords || !scoreData.sections) {
      return [];
    }
    
    const sections = [...scoreData.sections];
    
    // 获取调式信息
    const keyInfo = scoreData.keys && scoreData.keys.length > 0 
      ? scoreData.keys[0] 
      : { tonic: 'C', scale: 'major' };
    
    // 确保段落按照beat顺序排列
    sections.sort((a, b) => a.beat - b.beat);
    
    // 为每个段落分配和弦
    return sections.map((section, index) => {
      // 计算段落的开始和结束节拍
      const startBeat = section.beat;
      const endBeat = index < sections.length - 1 
        ? sections[index + 1].beat - 1 
        : Number.MAX_SAFE_INTEGER;
      
      // 过滤出该段落内的和弦
      const sectionChords = scoreData.chords.filter(
        chord => chord.beat >= startBeat && chord.beat <= endBeat
      );
      
      // 计算总的小节数（以4/4拍假设，可根据实际情况调整）
      const beatsPerMeasure = scoreData.meters && scoreData.meters.length > 0 
        ? scoreData.meters[0].numBeats 
        : 4;
      const measuresCount = sections.length > index + 1 ? Math.ceil((endBeat - startBeat + 1) / beatsPerMeasure) : scoreData.endBeat - scoreData.chords[scoreData.chords.length-1].beat;

      return {
        ...section,
        chords: sectionChords,
        measures: measuresCount,
        keyInfo // 添加调式信息到每个段落
      };
    });
  }, [scoreData]);
  
  // 处理加载状态和错误
  if (scoreLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>加载和弦数据中...</Typography>
      </Box>
    );
  }
  
  if (scoreError || !scoreData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          {scoreError ? `加载错误: ${scoreError.message}` : '无和弦数据'}
        </Typography>
      </Box>
    );
  }
  
  // 如果没有和弦或段落数据
  if (!scoreData.chords || !scoreData.sections || 
      scoreData.chords.length === 0 || scoreData.sections.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>该歌曲没有和弦分析数据</Typography>
      </Box>
    );
  }
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          和弦进行分析
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            乐曲包含 {scoreData.chords.length} 个和弦，分布在 {scoreData.sections.length} 个段落中
          </Typography>
        </Box>
        
        {chordsBySection.map((section, sectionIndex) => (
          <Paper 
            key={`section-${sectionIndex}`}
            elevation={1}
            sx={{ 
              p: 2, 
              mb: 2,
              borderLeft: `4px solid ${
                theme.palette.mode === 'dark' 
                  ? theme.palette.primary.dark 
                  : theme.palette.primary.light
              }`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {section.name}
              </Typography>
              <Chip 
                size="small" 
                label={`从第 ${Math.ceil(section.beat / 4)} 小节开始`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {section.chords.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                此段落没有和弦数据
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {section.chords.map((chord, chordIndex) => (
                  <Grid item key={`chord-${sectionIndex}-${chordIndex}`}>
                    <Chip
                      label={formatChord(chord, section.keyInfo)}
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.85rem',
                        height: 'auto',
                        py: 0.75,
                        fontFamily: 'monospace',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                      title={`拍: ${chord.beat}, 时值: ${chord.duration}`}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                包含 {section.chords.length} 个和弦，约 {section.measures} 小节
              </Typography>
            </Box>
          </Paper>
        ))}
        
        {/* 统计信息 */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary">
            和弦统计：最常用和弦 {(() => {
              // 统计最常用的和弦
              const chordCounts = {};
              scoreData.chords.forEach(chord => {
                const chordName = formatChord(chord);
                chordCounts[chordName] = (chordCounts[chordName] || 0) + 1;
              });
              
              // 找出出现次数最多的和弦
              let maxChord = '';
              let maxCount = 0;
              
              Object.entries(chordCounts).forEach(([chord, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  maxChord = chord;
                }
              });
              
              return `${maxChord} (${maxCount}次)`;
            })()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChordsBySection;