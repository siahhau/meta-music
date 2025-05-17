// frontend/src/app/dashboard/album/[id]/page.jsx
import axios from 'axios';
import { CONFIG } from 'src/global-config';
import {
  Card,
  Box,
  Typography,
  Divider,
  Link,
  Grid,
  CardHeader,
  TableContainer,
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Stack,
} from '@mui/material';
import { RouterLink } from 'src/routes/components';
import { ProfileCoverClient } from 'src/sections/album/profile-cover-client';
import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { CommentInput } from 'src/sections/album/comment-input';
import { RatingInput } from 'src/sections/album/rating-input';
import { ProfilePostItem } from 'src/sections/album/profile-post-item';
import TabHeader from 'src/sections/album/tab-header';
import styles from './album-page.module.css';
import CommentsSection from 'src/sections/album/comments-section';
import RatingsSection from 'src/sections/album/ratings-section';
import SyncButton from 'src/components/SyncButton';

// 转换毫秒为分钟:秒格式
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ----------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const id = params?.id || '';
  try {
    const res = await axios.get(`http://localhost:8000/albums/spotify/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const album = res.data;
    return {
      title: `${album.name || '未知专辑'} | Dashboard - ${CONFIG.appName}`,
    };
  } catch (error) {
    return {
      title: `专辑 | Dashboard - ${CONFIG.appName}`,
    };
  }
}

export default async function Page({ params }) {
  const id = params?.id || '';

  // 获取专辑数据
  let album = null;
  try {
    const res = await axios.get(`http://localhost:8000/albums/spotify/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    if (res.status === 200) {
      album = res.data;
      if (!album || !album.spotify_id) {
        throw new Error('专辑数据无效或缺失');
      }
    }
  } catch (error) {
    console.error('获取专辑失败:', error);
  }

  // 处理 tracks 数据
  const tracks = Array.isArray(album?.tracks?.tracks?.items) ? album.tracks.tracks.items : [];

  return (
    <DashboardContent maxWidth="xl">
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCoverClient
          role={album?.release_date || '未知日期'}
          name={album?.name || '未知专辑'}
          coverUrl={album?.image_url || ''}
          avatarUrl={album?.image_url || ''}
        />
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TabHeader commentsCount={0} />
      </Box>
      <div className={styles.sections}>
        {/* 模块 1: 详情 */}
        <div id="details" className={styles.section}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ gap: 3, display: 'flex', flexDirection: 'column', width: { md: '300px', xs: '100%' } }}>
              <Card>
                <CardHeader title="基础信息" />
                <Box
                  sx={{
                    p: 3,
                    gap: 2,
                    display: 'flex',
                    typography: 'body2',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="material-symbols-light:artist" />
                    <span>{album?.artist_name || '未知艺术家'}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="mynaui:label-solid" />
                    <span>{album?.label || '未知标签'}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="ic:round-album" />
                    <span>歌曲总数：{album?.total_tracks || 0}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="ic:round-category" />
                    <span>专辑类型：{album?.album_type || '未知类型'}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="material-symbols:date-range-outline-rounded" />
                    <span>{album?.release_date || '未知日期'}</span>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={8} sx={{ gap: 3, display: 'flex', flexDirection: 'column', width: { md: 'calc(100% - 326px)', xs: '100%' } }}>
              {album ? (
                <>
                  <RatingInput album={album} />
                  <RatingsSection album={album} />
                </>
              ) : (
                <Typography variant="body1">等待同步专辑数据...</Typography>
              )}
            </Grid>
          </Grid>
        </div>

        {/* 模块 2: 歌单 */}
        <div id="tracks" className={styles.section}>
          <TableContainer component={Card}>
            <Table sx={{ minWidth: 650 }} aria-label="tracks table">
              <TableHead>
                <TableRow>
                  <TableCell>歌曲名称</TableCell>
                  <TableCell>艺术家</TableCell>
                  <TableCell>专辑</TableCell>
                  <TableCell>时长</TableCell>
                  <TableCell>曲目编号</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>暂无歌曲</Typography>
                      <SyncButton spotifyId={id} />
                    </TableCell>
                  </TableRow>
                ) : (
                  tracks.map((track, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        <Link
                          component={RouterLink}
                          href={`/dashboard/track/${track.id || ''}`}
                          sx={{
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {track.name || '未知歌曲'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(track.artists) && track.artists.length > 0 ? (
                          track.artists.map((artist, idx) => (
                            <span key={idx}>
                              <Link
                                component={RouterLink}
                                href={`/dashboard/artist/${artist.id || ''}`}
                                sx={{
                                  color: 'text.primary',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {artist.name || '未知艺术家'}
                              </Link>
                              {idx < track.artists.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          '未知艺术家'
                        )}
                      </TableCell>
                      <TableCell>{album.name || '未知专辑'}</TableCell>
                      <TableCell>{formatDuration(track.duration_ms || 0)}</TableCell>
                      <TableCell>{track.track_number || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* 模块 3: 评论 */}
        <div id="comments" className={styles.section}>
          {album ? <CommentsSection album={album} /> : <Typography>等待同步专辑数据...</Typography>}
        </div>
      </div>
    </DashboardContent>
  );
}