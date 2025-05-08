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

// ----------------------------------------------------------------------

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
    });
    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const album = res.data;
    return {
      title: `${album.name} | Dashboard - ${CONFIG.appName}`,
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
  let album;
  try {
    const res = await axios.get(`http://localhost:8000/albums/spotify/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    album = res.data;
  } catch (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" color="error" gutterBottom>
          错误
        </Typography>
        <Typography variant="body1">无法加载专辑信息：{error.message}</Typography>
      </Box>
    );
  }

  // 获取评论数据
  let comments = { count: 0, items: [] };
  try {
    const res = await axios.get(`http://localhost:8000/albums/spotify/${id}/comments`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status !== 200) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    comments = res.data;
  } catch (error) {
    comments = { count: 0, items: [], error: error.message };
  }

  // 处理 tracks 数据
  const tracks = album?.tracks?.tracks?.items || [];

  return (
    <DashboardContent maxWidth="xl">
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCoverClient
          role={album.release_date}
          name={album.name}
          coverUrl={album.image_url}
          avatarUrl={album.image_url}
        />
      </Card>
      <TabHeader commentsCount={comments.count} />
      <div className={styles.sections}>
        {/* 模块 1: 详情 */}
        <div id="details" className={styles.section}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
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
                    <span>{album.artist_name}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="mynaui:label-solid" />
                    <span>{album.label}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="ic:round-album" />
                    <span>歌曲总数：{album.total_tracks}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="ic:round-category" />
                    <span>专辑类型：{album.album_type}</span>
                  </Box>
                  <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
                    <Iconify width={24} icon="material-symbols:date-range-outline-rounded" />
                    <span>{album.release_date}</span>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              <RatingInput album={album} />
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
                    </TableCell>
                  </TableRow>
                ) : (
                  tracks.map((track, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        <Link
                          component={RouterLink}
                          href={`/dashboard/track/${track.id}`}
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {track.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {track.artists?.map((artist, idx) => (
                          <span key={idx}>
                            <Link
                              component={RouterLink}
                              href={`/dashboard/artist/${artist.id}`}
                              sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {artist.name}
                            </Link>
                            {idx < track.artists.length - 1 ? ', ' : ''}
                          </span>
                        )) || 'Unknown'}
                      </TableCell>
                      <TableCell>{album.name}</TableCell>
                      <TableCell>{formatDuration(track.duration_ms)}</TableCell>
                      <TableCell>{track.track_number}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* 模块 3: 评论 */}
        <div id="comments" className={styles.section}>
          <Card sx={{ p: 3 }}>
            <CardHeader title={`评论 (${comments.count})`} />
            <Box sx={{ p: 3 }}>
              {comments.error ? (
                <Typography color="error">错误: {comments.error}</Typography>
              ) : comments.items.length === 0 ? (
                <Typography>暂无评论</Typography>
              ) : (
                <Stack spacing={3}>
                  {comments.items.map((comment) => (
                    <ProfilePostItem
                      key={comment.id}
                      post={{
                        id: comment.id,
                        message: comment.content,
                        createdAt: comment.created_at,
                        comments: [],
                        personLikes: [],
                        media: '',
                        score: comment.score || 0,
                      }}
                    />
                  ))}
                </Stack>
              )}
              <CommentInput album={album} />
            </Box>
          </Card>
        </div>
      </div>
    </DashboardContent>
  );
}
