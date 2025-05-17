// frontend/src/app/dashboard/track/[id]/page.jsx
import axios from 'axios';
import { CONFIG } from 'src/global-config';
import { Card, Box, Typography, Divider, Link, Grid, Rating, Chip } from '@mui/material';
import { RouterLink } from 'src/routes/components';
import ChordUpload from 'src/components/ChordUpload';
import ScoreDisplay from 'src/components/ScoreDisplay';

// ----------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const id = params?.id || '';

  try {
    const res = await axios.get(`http://localhost:8000/tracks/spotify/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const track = res.data;
    return {
      title: `${track.name} | Dashboard - ${CONFIG.appName}`,
    };
  } catch (error) {
    return {
      title: `歌曲 | Dashboard - ${CONFIG.appName}`,
    };
  }
}

export default async function Page({ params }) {
  const id = params?.id || '';

  try {
    const res = await axios.get(`http://localhost:8000/tracks/spotify/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const track = res.data;
    console.log('data:', track);

    // 假设评分值为固定值（可替换为后端获取）
    const ratingValue = 3.5;

    // 歌曲结构颜色映射
    const sectionColors = {
      Intro: 'success',
      Verse: 'info',
      Chorus: 'primary',
      Pre: 'warning',
      interlude: 'secondary',
      'Verse 2': 'info',
      'Pre 2': 'warning',
      'Chorus 2': 'primary',
      'Pre 3': 'warning',
      'Chorus 3': 'primary'
    };

    // 处理和弦显示
    let chordsDisplay = '无';
    console.log
    if (track.chords && track.chords.length > 0) {
      try {
        const chordsArray = track.chords;
        if (Array.isArray(chordsArray)) {
          chordsDisplay = chordsArray.join(', ');
        }
      } catch (e) {
        console.error('解析和弦失败:', e);
        chordsDisplay = track.chords; // 直接显示字符串
      }
    }

    return (
      <Box sx={{ maxWidth: 1920, p: 3 }}>
        {/* 顶部：歌名和歌手名 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 'bold',
              border: 'none',
              color: 'text.primary',
              fontSize: { xs: '2rem', sm: '3rem' },
            }}
          >
            {track.name}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {track.artist_name}
          </Typography>
        </Box>

        {/* 第一个 Card：歌曲信息 */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'text.primary',
              }}
            >
              歌曲信息
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={ratingValue}
                readOnly
                precision={0.5}
                size="medium"
              />
              <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                {ratingValue}/5
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>时长：</strong> {(track.duration_ms / 1000 / 60).toFixed(2)} 分钟
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>曲目编号：</strong> {track.track_number}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>人气：</strong> {track.popularity}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>发行日期：</strong> {track.release_date}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Spotify ID：</strong> {track.spotify_id}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>是否有谱：</strong> {track.chords && track.chords.length > 0 ? '有' : '无'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>调性：</strong>{' '}
              {track.key && track.scale ? `${track.key} ${track.scale}` : '未知'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>和弦进行：</strong>{' '} {chordsDisplay}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>歌曲结构：</strong>
              </Typography>
              {track.sections && track.sections.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {track.sections.map((section, index) => (
                    <Chip
                      key={index}
                      label={section}
                      variant="outlined"
                      color={sectionColors[section] || 'default'}
                      sx={{ fontSize: '0.875rem', borderRadius: '16px' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  无
                </Typography>
              )}
            </Box>
            {/* 异步加载简谱 */}
            <ScoreDisplay spotifyId={id} />
          </Box>
          {/* 嵌入上传组件 */}
          <ChordUpload spotifyId={id} />
        </Card>

        {/* 第二个 Card：专辑信息 */}
        <Link
          component={RouterLink}
          href={`/dashboard/album/${track.album_id}`}
          sx={{ textDecoration: 'none' }}
        >
          <Card sx={{ width: '960px', mb: 3, p: 3, '&:hover': { boxShadow: 6 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: 'text.primary',
              }}
            >
              专辑信息
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                {track.image_url ? (
                  <Box
                    component="img"
                    src={track.image_url}
                    alt={track.album_name}
                    sx={{ width: '100%', maxWidth: 150, borderRadius: 1 }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      无图片
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">
                  <strong>专辑名称：</strong> {track.album_name}
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Link>
      </Box>
    );
  } catch (error) {
    console.error('失败:', error);
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" color="error" gutterBottom>
          错误
        </Typography>
        <Typography variant="body1">
          无法加载歌曲信息：{error.message}
        </Typography>
        {error.response && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            后端错误详情：{JSON.stringify(error.response.data)}
          </Typography>
        )}
      </Box>
    );
  }
}