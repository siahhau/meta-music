"use client";
import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useGetScoreData } from '../actions/score'; // Adjust path as needed

// 格式化和弦显示 - 使用音阶度数（罗马数字）表示和弦
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

// 构建小节表格数据
const buildMeasureGrid = (chords, startBeat, endBeat, beatsPerMeasure = 4) => {
  const measures = [];
  let currentMeasure = [];
  let currentBeat = startBeat;
  
  // 预先排序和弦，确保按照beat顺序
  const sortedChords = [...chords].sort((a, b) => a.beat - b.beat);
  
  // 创建一个查询表，以便快速找到特定节拍的和弦
  const chordMap = {};
  sortedChords.forEach(chord => {
    if (chord.beat >= startBeat && chord.beat <= endBeat) {
      chordMap[chord.beat] = chord;
    }
  });
  
  // 填充小节网格
  while (currentBeat <= endBeat) {
    const measureIndex = Math.floor((currentBeat - startBeat) / beatsPerMeasure);
    const beatInMeasure = ((currentBeat - startBeat) % beatsPerMeasure) + 1;
    
    if (beatInMeasure === 1) {
      // 开始新的一个小节
      currentMeasure = Array(beatsPerMeasure).fill(null);
      measures[measureIndex] = currentMeasure;
    }
    
    // 如果这个节拍有和弦，添加到网格
    if (chordMap[currentBeat]) {
      currentMeasure[beatInMeasure - 1] = chordMap[currentBeat];
    }
    
    currentBeat++;
  }
  
  return measures;
};

const ChordProgressionDetail = ({ spotifyId }) => {
  const { scoreData, scoreLoading, scoreError } = useGetScoreData(spotifyId);
  const theme = useTheme();
  
  // 获取小节数（拍子）信息
  const timeSignature = useMemo(() => {
    if (!scoreData || !scoreData.meters || scoreData.meters.length === 0) {
      return { beatsPerMeasure: 4, beatUnit: 4 }; // 默认为4/4拍
    }
    
    // 使用第一个拍号（可能有多个，但我们简化处理）
    const firstMeter = scoreData.meters[0];
    return {
      beatsPerMeasure: firstMeter.numBeats,
      beatUnit: firstMeter.beatUnit
    };
  }, [scoreData]);
  
  // 将和弦按段落分组并创建小节网格
  const sectionsWithMeasures = useMemo(() => {
    if (!scoreData || !scoreData.chords || !scoreData.sections) {
      return [];
    }
    
    const sections = [...scoreData.sections];
    sections.sort((a, b) => a.beat - b.beat);
    
    // 获取调式信息
    const keyInfo = scoreData.keys && scoreData.keys.length > 0 
      ? scoreData.keys[0] 
      : { tonic: 'C', scale: 'major' };
    
    return sections.map((section, index) => {
      const startBeat = section.beat;
      const endBeat = index < sections.length - 1 
        ? sections[index + 1].beat - 1 
        : Math.max(...scoreData.chords.map(c => c.beat + c.duration));
      
      // 过滤该段落内的和弦
      const sectionChords = scoreData.chords.filter(
        chord => chord.beat >= startBeat && chord.beat <= endBeat
      );
      
      // 构建小节网格
      const measureGrid = buildMeasureGrid(
        sectionChords, 
        startBeat, 
        endBeat, 
        timeSignature.beatsPerMeasure
      );
      
      return {
        ...section,
        chords: sectionChords,
        measureGrid,
        startMeasure: Math.ceil(startBeat / timeSignature.beatsPerMeasure),
        endMeasure: Math.ceil(endBeat / timeSignature.beatsPerMeasure),
        keyInfo // 添加调式信息
      };
    });
  }, [scoreData, timeSignature.beatsPerMeasure]);
  
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
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          和弦进行详细视图
          {timeSignature && (
            <Chip 
              size="small" 
              label={`${timeSignature.beatsPerMeasure}/${timeSignature.beatUnit}`}
              sx={{ ml: 2 }}
              color="primary"
              variant="outlined"
            />
          )}
        </Typography>
        
        {sectionsWithMeasures.map((section, sectionIndex) => (
          <Accordion 
            key={`section-detail-${sectionIndex}`}
            defaultExpanded={sectionIndex === 0}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`section-${sectionIndex}-content`}
              id={`section-${sectionIndex}-header`}
            >
              <Typography sx={{ fontWeight: 'bold' }}>
                {section.name} 
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  小节 {section.startMeasure} - {section.endMeasure}
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                      <TableCell width="80px">小节</TableCell>
                      {Array.from({ length: timeSignature.beatsPerMeasure }).map((_, i) => (
                        <TableCell key={`beat-${i}`} align="center">拍{i + 1}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.measureGrid.map((measure, measureIndex) => (
                      <TableRow key={`measure-${sectionIndex}-${measureIndex}`}>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            bgcolor: theme.palette.action.hover 
                          }}
                        >
                          {section.startMeasure + measureIndex}
                        </TableCell>
                        {measure.map((chord, beatIndex) => (
                          <TableCell 
                            key={`cell-${sectionIndex}-${measureIndex}-${beatIndex}`}
                            align="center"
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: chord ? theme.palette.action.selected : 'inherit'
                            }}
                          >
                            {chord ? formatChord(chord, section.keyInfo) : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* 和弦功能分析 - 使用功能标记 */}
              {section.chords.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    和弦功能分析
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {section.chords.map((chord, i) => {
                      // 定义和弦功能标记
                      const getFunctionSymbol = (root, type) => {
                        // 简化的功能标记
                        if ([1, 3, 6].includes(root)) {
                          return "T"; // 主音功能 (Tonic)
                        } else if ([2, 4].includes(root)) {
                          return "S"; // 下属功能 (Subdominant) 
                        } else if ([5, 7].includes(root)) {
                          return "D"; // 属功能 (Dominant)
                        }
                        return "";
                      };
                      
                      const functionSymbol = getFunctionSymbol(chord.root, chord.type);
                      
                      return (
                        <Chip 
                          key={`function-${sectionIndex}-${i}`}
                          label={`${formatChord(chord, section.keyInfo)} ${functionSymbol ? `(${functionSymbol})` : ''}${chord.borrowed ? ' 借用' : ''}`}
                          variant="outlined"
                          size="small"
                          title={`拍: ${chord.beat}, 时值: ${chord.duration}`}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChordProgressionDetail;