'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import axios from 'axios';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Divider,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material';
import { ProfileCover } from '../user/profile-cover';
import { ProfilePostItem } from './profile-post-item';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useSearchParams } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  {
    value: '',
    label: '详情',
    icon: <Iconify width={24} icon="uil:comment-alt-info" />,
  },
  {
    value: 'tracks',
    label: '歌单',
    icon: <Iconify width={24} icon="fluent:list-28-regular" />,
  },
  {
    value: 'comments',
    label: '评论',
    icon: <Iconify width={24} icon="fluent:comment-24-regular" />,
  },
];

const createRedirectPath = (currentPath, query) => {
  const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
  return query ? `${currentPath}?${queryString}` : currentPath;
};

// 转换毫秒为分钟:秒格式
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ----------------------------------------------------------------------
const TAB_PARAM = 'tab';

export function AlbumView({ album }) {
  const { user } = useMockedUser();
  const fileRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('');
  const [comments, setComments] = useState({ count: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 获取当前选项卡
  useEffect(() => {
    const tab = searchParams.get(TAB_PARAM) ?? '';
    setSelectedTab(tab);
  }, [searchParams]);

  // 设置页面标题
  useEffect(() => {
    document.title = album.name;
  }, [album]);

  // 获取评论数据
  useEffect(() => {
    if (selectedTab === 'comments' && album?.spotify_id) {
      const fetchComments = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `http://localhost:8000/albums/spotify/${album.spotify_id}/comments`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          setComments(response.data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchComments();
    }
  }, [selectedTab, album]);

  // 处理评论输入
  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  // 处理发布评论
  const handlePostComment = useCallback(async () => {
    if (!message.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/albums/spotify/${album.spotify_id}/comments`,
        {
          content: message,
          user: user.displayName,
          score: rating, // 包含评分
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setComments((prev) => ({
        count: prev.count + 1,
        items: [...prev.items, response.data],
      }));
      setMessage('');
      setRating(0); // 清空评分
    } catch (err) {
      setError(err.message);
    }
  }, [message, rating, album, user]);

  // 处理评测输入
  const handleChangeReview = useCallback((event) => {
    setReview(event.target.value);
  }, []);

  // 处理发布评分和评测
  const handlePostRating = useCallback(async () => {
    if (rating === 0 && !review.trim()) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/albums/spotify/${album.spotify_id}/ratings`,
        {
          score: rating,
          review: review,
          user: user.displayName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setRating(0);
      setReview('');
    } catch (err) {
      setError(err.message);
    }
  }, [rating, review, album, user]);

  // 处理 album.tracks 数据
  const tracks = album?.tracks?.tracks?.items || [];

  return (
    <DashboardContent maxWidth="xl">
      <Card sx={{ mb: 3, height: 290 }}>
        <ProfileCover
          role={album.release_date}
          name={album.name}
          coverUrl={album.image_url}
          avatarUrl={album.image_url}
        />
        <Box
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 9,
            px: { md: 3 },
            display: 'flex',
            position: 'absolute',
            bgcolor: 'background.paper',
            justifyContent: { xs: 'center', md: 'flex-end' },
          }}
        >
          <Tabs value={selectedTab}>
            {NAV_ITEMS.map((tab) => (
              <Tab
                component={RouterLink}
                key={tab.value}
                value={tab.value}
                icon={tab.icon}
                label={`${tab.label} ${tab.value === 'comments' ? `(${comments.count})` : ''}`}
                href={createRedirectPath(pathname, tab.value)}
              />
            ))}
          </Tabs>
        </Box>
      </Card>

      {selectedTab === '' && (
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
            <Card sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    gap: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'text.secondary',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2">评分：</Typography>
                  <Rating
                    value={rating}
                    onChange={(event, newValue) => setRating(newValue)}
                    precision={1}
                    size="medium"
                  />
                </Box>
                <InputBase
                  multiline
                  fullWidth
                  rows={4}
                  value={review}
                  onChange={handleChangeReview}
                  placeholder="写下你的乐评..."
                  sx={[
                    (theme) => ({
                      p: 2,
                      borderRadius: 1,
                      border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
                    }),
                  ]}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  sx={{
                    gap: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Fab
                    size="small"
                    color="inherit"
                    variant="softExtended"
                    onClick={() => fileRef.current.click()}
                  >
                    <Iconify
                      icon="solar:gallery-wide-bold"
                      width={24}
                      sx={{ color: 'success.main' }}
                    />
                    图片/视频
                  </Fab>
                </Box>
                <Button variant="contained" onClick={handlePostRating}>
                  提交评分和评测
                </Button>
              </Box>
              <input ref={fileRef} type="file" style={{ display: 'none' }} />
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 'tracks' && (
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
                        {' '}
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
      )}

      {selectedTab === 'comments' && (
        <Card sx={{ p: 3 }}>
          <CardHeader title={`评论 (${comments.count})`} />
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Typography>加载中...</Typography>
            ) : error ? (
              <Typography color="error">错误: {error}</Typography>
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
                      score: comment.score || 0, // 传递评分
                    }}
                  />
                ))}
              </Stack>
            )}
            <Box
              sx={{
                gap: 2,
                display: 'flex',
                alignItems: 'center',
                p: (theme) => theme.spacing(3, 0, 0, 0),
              }}
            >
              <Avatar src={user?.photoURL} alt={user?.displayName}>
                {user?.displayName?.charAt(0).toUpperCase()}
              </Avatar>
              <InputBase
                fullWidth
                value={message}
                onChange={handleChangeMessage}
                placeholder="写下你的评论…"
                endAdornment={
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton size="small" onClick={() => fileRef.current.click()}>
                      <Iconify icon="solar:gallery-add-bold" />
                    </IconButton>
                    <IconButton size="small">
                      <Iconify icon="eva:smiling-face-fill" />
                    </IconButton>
                    <Button variant="contained" onClick={handlePostComment}>
                      发布
                    </Button>
                  </InputAdornment>
                }
                sx={[
                  (theme) => ({
                    pl: 1.5,
                    height: 40,
                    borderRadius: 1,
                    border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.32)}`,
                  }),
                ]}
              />
              <input ref={fileRef} type="file" style={{ display: 'none' }} />
            </Box>
          </Box>
        </Card>
      )}
    </DashboardContent>
  );
}
