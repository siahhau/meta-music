"use client";
import React from 'react';
import { Box, Typography, Tabs, Tab, Container } from '@mui/material';
import { useGetScoreData } from '../actions/score'; // Adjust path as needed
import ChordsBySection from './ChordsBySection';
import ChordProgressionDetail from './ChordProgressionDetail';

const ScoreDataViewer = ({ spotifyId }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const { scoreData, scoreLoading } = useGetScoreData(spotifyId);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 和弦和段落数量的统计信息
  const stats = React.useMemo(() => {
    if (!scoreData) return { chords: 0, sections: 0, hasSectionData: false };
    
    return {
      chords: scoreData.chords?.length || 0,
      sections: scoreData.sections?.length || 0,
      hasSectionData: Boolean(scoreData.sections?.length && scoreData.chords?.length)
    };
  }, [scoreData]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>乐曲分析</Typography>
        
        {!scoreLoading && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {stats.hasSectionData 
              ? `本曲包含 ${stats.chords} 个和弦，分布在 ${stats.sections} 个段落中。`
              : '无可用的和弦或段落数据。'}
          </Typography>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="乐曲分析标签页"
          >
            <Tab label="和弦概览" id="tab-0" />
            <Tab label="详细进行" id="tab-1" />
            {scoreData?.keys && scoreData.keys.length > 0 && (
              <Tab label="调性分析" id="tab-2" />
            )}
          </Tabs>
        </Box>
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && <ChordsBySection spotifyId={spotifyId} scoreData={scoreData} />}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && <ChordProgressionDetail spotifyId={spotifyId} />}
      </Box>
      
      {scoreData?.keys && scoreData.keys.length > 0 && (
        <Box role="tabpanel" hidden={tabValue !== 2}>
          {tabValue === 2 && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>调性分析</Typography>
              <Typography paragraph>
                主调: {scoreData.keys[0].tonic} {scoreData.keys[0].scale}
              </Typography>
              {/* 这里可以添加更多调性分析内容，如果有的话 */}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ScoreDataViewer;