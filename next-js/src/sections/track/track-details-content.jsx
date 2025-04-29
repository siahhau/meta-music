'use client';

import Image from 'next/image';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// JSON 验证 schema
const JsonSchema = zod.object({
  scoreData: zod.string().refine(
    (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: '无效的 JSON 格式' }
  ),
});

// 和弦颜色映射
const chordColors = {
  C: '#FF6347',
  'C#': '#FF4500',
  D: '#FFD700',
  'D#': '#FFA500',
  E: '#ADFF2F',
  F: '#00FF7F',
  'F#': '#00CED1',
  G: '#1E90FF',
  'G#': '#6A5ACD',
  A: '#FF69B4',
  'A#': '#BA55D3',
  B: '#7B68EE',
};

export function TrackDetailsContent({ track, sx, ...other }) {
  const router = useRouter();
  const [scoreData, setScoreData] = useState(null);
  const [scoreId, setScoreId] = useState(null);
  const [scoreStatus, setScoreStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isEditingJson, setIsEditingJson] = useState(false);

  const formatDuration = (ms) => {
    if (!ms) return '未知';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 获取乐谱数据
  useEffect(() => {
    const fetchScoreData = async () => {
      if (!track?.spotify_id) return;
      try {
        const response = await axiosInstance.get(`${endpoints.score.list}?track_id=${track.spotify_id}`);
        const userScore = response.data[0];
        if (userScore) {
          setScoreId(userScore.id);
          setScoreData(userScore.score_data);
          setScoreStatus(userScore.status);
          setValue('scoreData', JSON.stringify(userScore.score_data, null, 2));
        }
      } catch (err) {
        console.error('获取乐谱失败:', err);
        setError('无法获取乐谱信息，请稍后重试');
      }
    };
    fetchScoreData();
  }, [track?.spotify_id]);

  // 获取音符总数
  const getNoteCount = (scoreData) => {
    return scoreData?.notes?.length || 0;
  };

  // 获取和弦总数
  const getChordCount = (scoreData) => {
    return scoreData?.chords?.length || 0;
  };

  // 解析歌曲结构
  const getStructure = (scoreData) => {
    const sections = scoreData?.sections || [];
    if (!sections.length) return <Typography variant="body2">未知</Typography>;

    const getSectionColor = (sectionName) => {
      const lowerName = sectionName.toLowerCase();
      if (lowerName.includes('intro')) return '#4CAF50';
      if (lowerName.includes('verse')) return '#2196F3';
      if (lowerName.includes('chorus')) return '#FF9800';
      if (lowerName.includes('bridge')) return '#9C27B0';
      if (lowerName.includes('outro')) return '#F44336';
      return '#607D8B';
    };

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {sections.map((section, index) => (
          <Button
            key={index}
            size="small"
            variant="contained"
            sx={{
              backgroundColor: getSectionColor(section.name),
              color: '#fff',
              '&:hover': {
                backgroundColor: getSectionColor(section.name),
                opacity: 0.9,
              },
              borderRadius: '16px',
              textTransform: 'none',
              fontSize: '0.75rem',
              padding: '2px 8px',
            }}
          >
            {section.name}
          </Button>
        ))}
      </Box>
    );
  };

  // 获取段落和弦进行
  const getChordProgression = (scoreData, sectionName) => {
    const chords = scoreData?.chords || [];
    const key = scoreData?.keys?.[0];
    const sections = scoreData?.sections || [];
    const relativeChordsData = scoreData?.relative_chords || [];
    if (!chords.length || !key) return <Typography variant="body2">无和弦</Typography>;

    const majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const minorScale = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'];
    const tonicIndex = majorScale.indexOf(key.tonic || 'C');
    const isMajor = key.scale === 'major';
    const scale = isMajor ? majorScale : minorScale;

    const section = sections.find((s) => s.name.toLowerCase().includes(sectionName.toLowerCase()));
    if (!section) return <Typography variant="body2">未找到该段落</Typography>;

    const nextSection = sections.find((s) => s.beat > section.beat);
    const startBeat = section.beat;
    const endBeat = nextSection ? nextSection.beat : Infinity;
    const filteredChords = chords.filter(
      (chord) => chord.beat >= startBeat && chord.beat < endBeat
    );

    const chordNames = filteredChords.map((chord) => {
      const rootIndex = (chord.root - 1 + tonicIndex) % 7;
      let chordName = scale[rootIndex];
      if (!isMajor && [3, 6, 7].includes(chord.root)) chordName += 'm';
      if (chord.type === 7) chordName += '7';
      return chordName;
    });

    const uniqueChords = [...new Set(chordNames)];

    const sectionRelative = relativeChordsData.find((rc) =>
      rc.section.toLowerCase().includes(sectionName.toLowerCase())
    );
    const uniqueRelativeChords = sectionRelative ? sectionRelative.chords : [];

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ minWidth: '100px', color: 'grey.600' }}>
            绝对和弦：
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {uniqueChords.length ? (
              uniqueChords.map((chord, index) => {
                const baseChord = chord.replace(/[m7]/g, '');
                const color = chordColors[baseChord] || '#607D8B';
                return (
                  <Button
                    key={index}
                    size="small"
                    variant="contained"
                    sx={{
                      backgroundColor: color,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: color,
                        opacity: 0.9,
                      },
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      mr: 0.5,
                    }}
                  >
                    {chord}
                  </Button>
                );
              })
            ) : (
              <Typography variant="body2" sx={{ color: 'grey.600' }}>
                无和弦
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ minWidth: '100px', color: 'grey.600' }}>
            相对和弦：
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {uniqueRelativeChords.length ? (
              uniqueRelativeChords.map((number, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#607D8B',
                    color: '#607D8B',
                    '&:hover': {
                      borderColor: '#607D8B',
                      backgroundColor: 'rgba(96, 125, 139, 0.1)',
                    },
                    borderRadius: '16px',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    mr: 0.5,
                  }}
                >
                  {number}
                </Button>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'grey.600' }}>
                无相对和弦
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const methods = useForm({
    resolver: zodResolver(JsonSchema),
    defaultValues: { scoreData: '' },
  });

  const { handleSubmit, setValue, reset } = methods;

  const handleLoginRedirect = () => {
    router.push('/dashboard/login');
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const parsedScoreData = JSON.parse(data.scoreData);
      const payload = {
        track_id: track.spotify_id,
        score_data: parsedScoreData,
      };

      let response;
      if (scoreId) {
        // 更新现有乐谱
        response = await axiosInstance.put(`${endpoints.score.update.replace(':pk', scoreId)}`, payload);
      } else {
        // 创建新乐谱
        response = await axiosInstance.post(endpoints.score.create, payload);
      }

      // 刷新乐谱数据
      const scoresResponse = await axiosInstance.get(`${endpoints.score.list}?track_id=${track.spotify_id}`);
      const userScore = scoresResponse.data[0];
      if (userScore) {
        setScoreId(userScore.id);
        setScoreData(userScore.score_data);
        setScoreStatus(userScore.status);
        setValue('scoreData', JSON.stringify(userScore.score_data, null, 2));
      }
      setIsEditingJson(false);
      setError(null);
      toast.success(scoreId ? '更新乐谱成功！' : '上传乐谱成功！');
    } catch (err) {
      console.error('保存乐谱失败:', err);
      if (err.response?.status === 401) {
        setError('未授权，请登录后重试');
      } else {
        setError(err.response?.data?.error || '保存乐谱失败，请检查 JSON 格式或稍后重试');
      }
    }
  });

  const handleFileDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedScoreData = JSON.parse(text);
      const payload = {
        track_id: track.spotify_id,
        score_data: parsedScoreData,
      };

      let response;
      if (scoreId) {
        response = await axiosInstance.put(`${endpoints.score.update.replace(':pk', scoreId)}`, payload);
      } else {
        response = await axiosInstance.post(endpoints.score.create, payload);
      }

      const scoresResponse = await axiosInstance.get(`${endpoints.score.list}?track_id=${track.spotify_id}`);
      const userScore = scoresResponse.data[0];
      if (userScore) {
        setScoreId(userScore.id);
        setScoreData(userScore.score_data);
        setScoreStatus(userScore.status);
        setValue('scoreData', JSON.stringify(userScore.score_data, null, 2));
      }
      setError(null);
      toast.success(scoreId ? '更新乐谱成功！' : '上传乐谱成功！');
    } catch (err) {
      console.error('上传乐谱失败:', err);
      if (err.response?.status === 401) {
        setError('未授权，请登录后重试');
      } else {
        setError('乐谱上传失败，请检查文件格式或稍后重试');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: { 'application/json': ['.json'] },
  });

  const handleToggleEditJson = () => {
    setIsEditingJson(!isEditingJson);
    if (!isEditingJson && scoreData) {
      setValue('scoreData', JSON.stringify(scoreData, null, 2));
    } else {
      reset();
    }
  };

  const renderOverview = () => (
    <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
      {track?.image_url && (
        <Image
          src={track.image_url}
          alt={track.name || '未知歌曲'}
          width={128}
          height={128}
          style={{
            borderRadius: 8,
            marginBottom: 16,
            objectFit: 'cover',
          }}
          placeholder="blur"
          blurDataURL="/assets/placeholder.png"
        />
      )}
      {[
        {
          label: '艺术家',
          value: track?.artist_name || '未知',
          icon: <Iconify icon="solar:user-rounded-bold" />,
        },
        {
          label: '专辑',
          value: track?.album_name || '未知',
          icon: <Iconify icon="solar:album-bold" />,
        },
        {
          label: '发布日期',
          value: track?.release_date ? fDate(track.release_date) : '未知',
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: '时长',
          value: track?.duration_ms ? formatDuration(track.duration_ms) : '未知',
          icon: <Iconify icon="solar:clock-circle-bold" />,
        },
        {
          label: '流行度',
          value: track?.popularity || 0,
          icon: <Iconify icon="solar:star-bold" />,
        },
        {
          label: 'Explicit',
          value: track?.explicit ? '是' : '否',
          icon: <Iconify icon="solar:warning-bold" />,
        },
      ].map((item) => (
        <Box key={item.label} sx={{ gap: 1.5, display: 'flex', alignItems: 'center' }}>
          {item.icon}
          <ListItemText
            primary={item.label}
            secondary={item.value}
            slotProps={{
              primary: { sx: { typography: 'body2', color: 'text.secondary' } },
              secondary: { sx: { mt: 0.5, typography: 'subtitle2', lineHeight: 1.6 } },
            }}
          />
        </Box>
      ))}
    </Card>
  );

  const renderContent = () => (
    <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">{track?.name || '未知歌曲'}</Typography>
      <Typography variant="body1">Spotify ID: {track?.spotify_id}</Typography>
      <Typography variant="body2">
        创建时间: {track?.created_at ? fDate(track.created_at) : '未知'}
      </Typography>
    </Card>
  );

  const renderScoreInfo = () => (
    <Card sx={{ p: 3, mt: 3, gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">歌谱信息</Typography>
      {error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Alert severity="error">{error}</Alert>
          {error.includes('未授权') && (
            <Button variant="contained" onClick={handleLoginRedirect}>
              登录
            </Button>
          )}
        </Box>
      )}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
          调性: {scoreData?.keys?.[0]?.tonic || '未知'}
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
          调式: {scoreData?.keys?.[0]?.scale === 'major' ? '大调' : scoreData?.keys?.[0]?.scale === 'minor' ? '小调' : '未知'}
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
          音符数量: {getNoteCount(scoreData)}
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
          和弦数量: {getChordCount(scoreData)}
        </Typography>
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
          歌曲结构
        </Typography>
        {getStructure(scoreData)}
      </Box>
      {scoreData?.sections?.map((section, index) => (
        <Box key={index}>
          <Typography variant="subtitle1" sx={{ mb: 1, color: 'grey.600' }}>
            {section.name} 和弦进行
          </Typography>
          {getChordProgression(scoreData, section.name)}
        </Box>
      ))}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleToggleEditJson}
          startIcon={<Iconify icon={isEditingJson ? 'eva:close-fill' : 'eva:edit-fill'} />}
        >
          {isEditingJson ? '取消编辑' : '编辑 JSON'}
        </Button>
        {isEditingJson && (
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ mt: 2 }}>
              <Field.Text
                name="scoreData"
                label="歌谱数据 (JSON)"
                multiline
                rows={10}
                fullWidth
                helperText="请输入有效的 JSON 格式歌谱数据"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" color="primary">
                  保存
                </Button>
                <Button variant="outlined" onClick={handleToggleEditJson}>
                  取消
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Box>
    </Card>
  );

  const renderUploadArea = () => (
    <Card sx={{ p: 3, mt: 3, gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">上传歌谱</Typography>
      {error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Alert severity="error">{error}</Alert>
          {error.includes('未授权') && (
            <Button variant="contained" onClick={handleLoginRedirect}>
              登录
            </Button>
          )}
        </Box>
      )}
      <Box
        {...getRootProps()}
        sx={{
          p: 3,
          border: '1px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          bgcolor: isDragActive ? 'grey.100' : 'grey.50',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Iconify icon="eva:cloud-upload-fill" width={40} />
          <Typography variant="body2">
            {isDragActive ? '拖拽文件到这里' : '拖拽或点击选择 JSON 文件'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            仅支持 JSON 格式
          </Typography>
        </Box>
      </Box>
    </Card>
  );

  return (
    <Grid container spacing={3} sx={sx} {...other}>
      <Grid xs={12} md={8}>
        {renderContent()}
        {renderUploadArea()}
        {scoreData && renderScoreInfo()}
      </Grid>
      <Grid xs={12} md={4}>
        {renderOverview()}
      </Grid>
    </Grid>
  );
}
