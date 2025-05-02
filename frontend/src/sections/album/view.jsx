'use client';
import { useRef, useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  Button,
  Card,
  CardHeader,
  Divider,
  Fab,
  Grid,
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
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useSearchParams } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

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
    value: 'fans',
    label: '粉丝',
    icon: <Iconify width={24} icon="fluent:likert-16-filled" />,
  },
  {
    value: 'albums',
    label: '其他专辑',
    icon: <Iconify width={24} icon="ic:round-album" />,
  },
];

const createRedirectPath = (currentPath, query) => {
  const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
  return query ? `${currentPath}?${queryString}` : currentPath;
};

// ----------------------------------------------------------------------
const TAB_PARAM = 'tab';

export function AlbumView({ album, albums }) {
  const fileRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('');

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

  // 处理 album.tracks 数据
  const tracks = album?.tracks || []; // 假设 tracks 是 { items: [...] } 结构

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
                label={tab.label}
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
                  <Iconify width={24} icon="material-symbols:date-range-outline-rounded" />
                  <span>{album.release_date}</span>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ p: 3 }}>
              <InputBase
                multiline
                fullWidth
                rows={4}
                placeholder="Share what you are thinking here..."
                inputProps={{ id: 'post-input' }}
                sx={[
                  (theme) => ({
                    p: 2,
                    mb: 3,
                    borderRadius: 1,
                    border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
                  }),
                ]}
              />
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
                  <Fab size="small" color="inherit" variant="softExtended" onClick={() => {}}>
                    <Iconify
                      icon="solar:gallery-wide-bold"
                      width={24}
                      sx={{ color: 'success.main' }}
                    />
                    Image/Video
                  </Fab>
                  <Fab size="small" color="inherit" variant="softExtended">
                    <Iconify
                      icon="solar:videocamera-record-bold"
                      width={24}
                      sx={{ color: 'error.main' }}
                    />
                    Streaming
                  </Fab>
                </Box>
                <Button variant="contained">Post</Button>
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
                <TableCell>时长 (ms)</TableCell>
                <TableCell>曲目编号</TableCell>
                <TableCell>人气</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>暂无歌曲</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tracks.map((track, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      {track.name}
                    </TableCell>
                    <TableCell>{track.artists?.map(artist => artist.name).join(', ') || 'Unknown'}</TableCell>
                    <TableCell>{album.name}</TableCell>
                    <TableCell>{track.duration_ms}</TableCell>
                    <TableCell>{track.track_number}</TableCell>
                    <TableCell>{track.popularity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedTab === 'albums' && (
        <Grid container spacing={3}>
          {albums.map((albumItem) => (
            <Grid key={albumItem.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardHeader title={albumItem.name} subheader={albumItem.artist_name} />
                <Box sx={{ p: 2 }}>
                  <img
                    src={albumItem.image_url}
                    alt={albumItem.name}
                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2">发行日期: {albumItem.release_date}</Typography>
                  <Typography variant="body2">总曲目: {albumItem.total_tracks}</Typography>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    href={`/album/${albumItem.spotify_id}`}
                    sx={{ mt: 2 }}
                  >
                    查看详情
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardContent>
  );
}
