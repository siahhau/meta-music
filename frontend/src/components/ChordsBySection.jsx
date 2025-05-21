'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  Grid, 
  Paper,
  Button,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { saveChordProgression, getChordProgressions } from '../api/chord';
import axios from 'axios';
import { Link as RouterLink } from 'next/link';

// ChordsBySection 组件
const ChordsBySection = ({ spotifyId, scoreData }) => {
  const theme = useTheme();
  const [savingStates, setSavingStates] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 添加选择和弦的状态
  const [selectedChords, setSelectedChords] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 加载已存在的和弦进行数据
  useEffect(() => {
    const loadSavedProgressions = async () => {
      if (!spotifyId) return;
      
      try {
        const result = await getChordProgressions(spotifyId);
        // 设置已保存的状态
        const savedStates = {};
        result.items.forEach(item => {
          savedStates[item.section_index] = 'success';
        });
        setSavingStates(prev => ({
          ...prev,
          ...savedStates
        }));
      } catch (error) {
        console.error("加载已保存的和弦进行失败:", error);
      }
    };
    
    loadSavedProgressions();
  }, [spotifyId]);

  // 处理保存和弦操作
  const handleSaveChordProgression = async (section, sectionIndex) => {
    // 设置当前部分为保存中状态
    setSavingStates(prev => ({
      ...prev,
      [sectionIndex]: 'saving'
    }));
    
    try {
      // 准备要保存的数据
      const chordsFormatted = section.chords.map(chord => 
        formatChord(chord, section.keyInfo)
      ).join(' ');
      
      const dataToSave = {
        chordProgression: chordsFormatted,
        sectionName: section.name,
        sectionIndex,
        spotifyId
      };
      
      // 调用保存API
      const result = await saveChordProgression(dataToSave);
      
      // 更新保存状态为成功
      setSavingStates(prev => ({
        ...prev,
        [sectionIndex]: 'success'
      }));
      
      // 显示成功消息
      setSnackbar({
        open: true,
        message: `成功保存 "${section.name}" 段落的和弦进行`,
        severity: 'success'
      });
    } catch (error) {
      console.error("保存和弦进行失败:", error);
      
      // 更新保存状态为失败
      setSavingStates(prev => ({
        ...prev,
        [sectionIndex]: 'error'
      }));
      
      // 显示错误消息
      setSnackbar({
        open: true,
        message: `保存失败: ${error.message || '未知错误'}`,
        severity: 'error'
      });
    }
  };
  
  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // 处理和弦点击/选择
  const handleChordClick = (chord, formattedChord, sectionIndex, chordIndex) => {
    const chordId = `${sectionIndex}-${chordIndex}`;
    
    setSelectedChords(prev => {
      // 检查是否已经选中
      const existingIndex = prev.findIndex(item => item.id === chordId);
      
      if (existingIndex >= 0) {
        // 如果已选中，则移除
        return prev.filter(item => item.id !== chordId);
      } else {
        // 如果未选中，则添加
        return [...prev, {
          id: chordId,
          chord,
          formattedChord,
          sectionIndex,
          chordIndex
        }];
      }
    });
  };
  
  // 清除所有选中的和弦
  const handleClearSelection = () => {
    setSelectedChords([]);
  };
  
  // 搜索相似和弦进行
  const handleSearchSimilarProgressions = async () => {
    if (selectedChords.length === 0) {
      setSnackbar({
        open: true,
        message: '请先选择至少一个和弦',
        severity: 'warning'
      });
      return;
    }
    
    setSearching(true);
    
    try {
      // 构建和弦进行字符串
      const progression = selectedChords
        .sort((a, b) => {
          // 按照段落和和弦索引排序，确保按照乐曲中的顺序
          if (a.sectionIndex !== b.sectionIndex) {
            return a.sectionIndex - b.sectionIndex;
          }
          return a.chordIndex - b.chordIndex;
        })
        .map(item => item.formattedChord)
        .join(' ');
      
      // 调用后端API搜索相似和弦进行
      const response = await axios.get(`http://localhost:8000/tracks/search-by-progression`, {
        params: { progression }
      });
      
      setSearchResults(response.data);
      setDialogOpen(true);
    } catch (error) {
      console.error('搜索相似和弦进行失败:', error);
      setSnackbar({
        open: true,
        message: `搜索失败: ${error.message || '未知错误'}`,
        severity: 'error'
      });
      // 即使出错，也显示对话框，但结果为空
      setSearchResults({ count: 0, tracks: [] });
      setDialogOpen(true);
    } finally {
      setSearching(false);
    }
  };
  
  // 关闭结果对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // 计算各段落的和弦
  const chordsBySection = React.useMemo(() => {
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
      const measuresCount = sections.length > index + 1 
        ? Math.ceil((endBeat - startBeat + 1) / beatsPerMeasure) 
        : scoreData.endBeat - scoreData.chords[scoreData.chords.length-1].beat;

      return {
        ...section,
        chords: sectionChords,
        measures: measuresCount,
        keyInfo // 添加调式信息到每个段落
      };
    });
  }, [scoreData]);
  
  // 如果没有数据，显示空状态
  if (!scoreData || !scoreData.chords || !scoreData.sections || 
      scoreData.chords.length === 0 || scoreData.sections.length === 0) {
    return null;
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
        
        {/* 选中的和弦显示区域 */}
        {selectedChords.length > 0 && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'primary.main',
            boxShadow: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                已选择 {selectedChords.length} 个和弦:
              </Typography>
              <Box>
                <Button
                  size="small"
                  startIcon={<ClearAllIcon />}
                  onClick={handleClearSelection}
                  sx={{ mr: 1 }}
                >
                  清除选择
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={searching ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                  onClick={handleSearchSimilarProgressions}
                  disabled={searching}
                >
                  查找相似进行
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedChords
                .sort((a, b) => {
                  if (a.sectionIndex !== b.sectionIndex) {
                    return a.sectionIndex - b.sectionIndex;
                  }
                  return a.chordIndex - b.chordIndex;
                })
                .map((item, index) => (
                  <Chip
                    key={item.id}
                    label={item.formattedChord}
                    color="primary"
                    variant="filled"
                    onClick={() => handleChordClick(item.chord, item.formattedChord, item.sectionIndex, item.chordIndex)}
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))
              }
            </Box>
          </Box>
        )}
        
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
              <>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {section.chords.map((chord, chordIndex) => {
                    const formattedChord = formatChord(chord, section.keyInfo);
                    const chordId = `${sectionIndex}-${chordIndex}`;
                    const isSelected = selectedChords.some(item => item.id === chordId);
                    
                    return (
                      <Grid item key={`chord-${sectionIndex}-${chordIndex}`}>
                        <Chip
                          label={formattedChord}
                          variant={isSelected ? "filled" : "outlined"}
                          color={isSelected ? "primary" : "default"}
                          onClick={() => handleChordClick(chord, formattedChord, sectionIndex, chordIndex)}
                          sx={{ 
                            fontSize: '0.85rem',
                            height: 'auto',
                            py: 0.75,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                          title={`拍: ${chord.beat}, 时值: ${chord.duration}${isSelected ? ' (已选择)' : ' (点击选择)'}`}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
                
                {/* 保存按钮 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    包含 {section.chords.length} 个和弦，约 {section.measures} 小节
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color={savingStates[sectionIndex] === 'success' ? 'success' : savingStates[sectionIndex] === 'error' ? 'error' : 'primary'}
                    onClick={() => handleSaveChordProgression(section, sectionIndex)}
                    disabled={savingStates[sectionIndex] === 'saving' || savingStates[sectionIndex] === 'success'}
                    startIcon={
                      savingStates[sectionIndex] === 'saving' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : savingStates[sectionIndex] === 'success' ? (
                        <CheckCircleIcon />
                      ) : savingStates[sectionIndex] === 'error' ? (
                        <ErrorOutlineIcon />
                      ) : (
                        <SaveIcon />
                      )
                    }
                  >
                    {savingStates[sectionIndex] === 'saving' 
                      ? '保存中...' 
                      : savingStates[sectionIndex] === 'success' 
                        ? '已保存' 
                        : savingStates[sectionIndex] === 'error'
                          ? '重试' 
                          : '保存和弦进行'}
                  </Button>
                </Box>
              </>
            )}
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
        
        {/* 搜索结果对话框 */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            相似和弦进行的歌曲
            {searchResults && (
              <Typography variant="caption" display="block" color="text.secondary">
                和弦进行: {selectedChords
                  .sort((a, b) => {
                    if (a.sectionIndex !== b.sectionIndex) {
                      return a.sectionIndex - b.sectionIndex;
                    }
                    return a.chordIndex - b.chordIndex;
                  })
                  .map(item => item.formattedChord)
                  .join(' ')}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {searchResults && (
              <>
                {searchResults.count > 0 ? (
                  <List>
                    {searchResults.tracks.map((track) => (
                      <ListItem 
                        key={track.spotify_id}
                        component={RouterLink}
                        href={`/dashboard/track/${track.spotify_id}`}
                        button
                        sx={{ 
                          mb: 1, 
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={track.image_url}
                            alt={track.name}
                            variant="rounded"
                          >
                            <MusicNoteIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={track.name}
                          secondary={`${track.artist_name} · ${track.match_score ? `匹配度: ${(track.match_score * 100).toFixed(0)}%` : ''}`}
                          primaryTypographyProps={{
                            fontWeight: 'medium',
                            variant: 'body1'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">
                      未找到包含相似和弦进行的歌曲
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>关闭</Button>
          </DialogActions>
        </Dialog>
        
        {/* 消息提示 */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={5000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

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

export default ChordsBySection;