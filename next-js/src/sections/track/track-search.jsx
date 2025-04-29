'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import axiosInstance from 'src/lib/axios';
import { endpoints } from 'src/lib/axios';
import { Iconify } from 'src/components/iconify';
import { useDebounce } from 'minimal-shared/hooks';

// ----------------------------------------------------------------------

export function TrackSearch({ sx }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);

  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 500);

  // 快捷键 Cmd + K
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 点击外部隐藏结果
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsResultsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索 API 请求
  const fetchSearchResults = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.trim().length === 0) {
      setSearchResults([]);
      setIsResultsVisible(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsResultsVisible(true);

    try {
      const response = await axiosInstance.get(endpoints.track.search, {
        params: {
          q: debouncedQuery,
          limit: 30,
          types: 'track,artist,album',
        },
      });
      setSearchResults(response.data.results || []);
      if (!response.data.results || response.data.results.length === 0) {
        setError('没有找到结果');
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError(err.response?.data?.error || '搜索失败，请检查网络或稍后重试');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // 处理结果点击
  const handleResultClick = useCallback(
    (result) => {
      setIsResultsVisible(false);
      setSearchQuery('');
      if (result.type === 'track') {
        router.push(paths.dashboard.track.details(result.spotify_id));
      } else if (result.type === 'album') {
        router.push(paths.dashboard.album.details(result.spotify_id));
      } else {
        console.log('艺术家详情未实现:', result);
      }
    },
    [router]
  );

  // 分组结果
  const groupedResults = {
    track: searchResults.filter((result) => result.type === 'track').slice(0, 10),
    artist: searchResults.filter((result) => result.type === 'artist').slice(0, 10),
    album: searchResults.filter((result) => result.type === 'album').slice(0, 10),
  };

  return (
    <Box
      ref={searchContainerRef}
      sx={[{ position: 'relative', width: { xs: '100%', sm: 260 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <TextField
        inputRef={inputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => debouncedQuery && setIsResultsVisible(true)}
        placeholder="搜索歌曲、艺术家、专辑..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: isLoading ? (
            <CircularProgress size={18} />
          ) : (
            <InputAdornment position="end">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ⌘K
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiInputBase-root': { height: 40 } }}
      />

      {isResultsVisible && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 384,
            overflowY: 'auto',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 3,
            zIndex: 1300,
            width: { xs: '100%', sm: 320 },
          }}
        >
          {isLoading && (
            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              正在搜索...
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ p: 2, textAlign: 'center' }}>
              {error}
            </Alert>
          )}
          {!isLoading && !error && searchResults.length === 0 && debouncedQuery && (
            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              没有找到结果
            </Typography>
          )}
          {!isLoading && !error && searchResults.length > 0 && (
            <Box>
              <Typography sx={{ p: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                找到 {searchResults.length} 条结果（单曲: {groupedResults.track.length}, 艺术家: {groupedResults.artist.length}, 专辑: {groupedResults.album.length}）
              </Typography>

              {groupedResults.track.length > 0 && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={{ px: 2, py: 1, fontWeight: 'medium', fontSize: '0.875rem' }}>
                    单曲
                  </Typography>
                  {groupedResults.track.map((result) => {
                    const matches = match(result.name, debouncedQuery);
                    const parts = parse(result.name, matches);
                    return (
                      <Box
                        key={`${result.type}-${result.spotify_id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                          borderTop: 1,
                          borderColor: 'divider',
                        }}
                        onClick={() => handleResultClick(result)}
                      >
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap>
                            {parts.map((part, index) => (
                              <span
                                key={index}
                                style={{ color: part.highlight ? 'primary.main' : 'text.primary' }}
                              >
                                {part.text}
                              </span>
                            ))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {result.artist_name} • 单曲
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {groupedResults.artist.length > 0 && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={{ px: 2, py: 1, fontWeight: 'medium', fontSize: '0.875rem' }}>
                    艺术家
                  </Typography>
                  {groupedResults.artist.map((result) => {
                    const matches = match(result.name, debouncedQuery);
                    const parts = parse(result.name, matches);
                    return (
                      <Box
                        key={`${result.type}-${result.spotify_id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          borderTop: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap>
                            {parts.map((part, index) => (
                              <span
                                key={index}
                                style={{ color: part.highlight ? 'primary.main' : 'text.primary' }}
                              >
                                {part.text}
                              </span>
                            ))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            艺术家
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {groupedResults.album.length > 0 && (
                <Box>
                  <Typography sx={{ px: 2, py: 1, fontWeight: 'medium', fontSize: '0.875rem' }}>
                    专辑
                  </Typography>
                  {groupedResults.album.map((result) => {
                    const matches = match(result.name, debouncedQuery);
                    const parts = parse(result.name, matches);
                    return (
                      <Box
                        key={`${result.type}-${result.spotify_id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                          borderTop: 1,
                          borderColor: 'divider',
                        }}
                        onClick={() => handleResultClick(result)}
                      >
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap>
                            {parts.map((part, index) => (
                              <span
                                key={index}
                                style={{ color: part.highlight ? 'primary.main' : 'text.primary' }}
                              >
                                {part.text}
                              </span>
                            ))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {result.artist_name} • 专辑
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
