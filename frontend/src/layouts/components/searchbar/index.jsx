'use client';
import { useState, useEffect, useCallback } from 'react';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import axios from 'axios';

import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog, { dialogClasses } from '@mui/material/Dialog';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import InputBase, { inputBaseClasses } from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const breakpoint = 'sm';

// 映射 type 到中文标签
const typeLabels = {
  track: '单曲',
  album: '专辑',
  artist: '艺术家',
};

export function Searchbar({ sx, ...other }) {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up(breakpoint));

  const { value: open, onFalse: onClose, onTrue: onOpen, onToggle } = useBoolean();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 关闭搜索框并重置状态
  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, [onClose]);

  // 处理快捷键 ⌘K
  const handleKeyDown = useCallback(
    (event) => {
      if (event.metaKey && event.key.toLowerCase() === 'k') {
        onToggle();
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
      }
    },
    [onToggle]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 处理搜索输入
  const handleSearch = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  // 调用搜索接口
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:8000/search', {
          params: { q: searchQuery },
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.status !== 200) {
          throw new Error(`搜索失败！状态码: ${response.status}`);
        }
        setSearchResults(response.data.results || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSearchResults, 300); // 防抖，减少请求频率
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const notFound = searchQuery && !searchResults.length && !isLoading && !error;

  // 渲染搜索按钮
  const renderButton = () => (
    <Box
      onClick={onOpen}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          [theme.breakpoints.up(breakpoint)]: {
            pr: 1,
            borderRadius: 1.5,
            cursor: 'pointer',
            bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            transition: theme.transitions.create('background-color', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': {
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component={smUp ? 'span' : IconButton}
        sx={{
          [theme.breakpoints.up(breakpoint)]: {
            p: 1,
            display: 'inline-flex',
            color: 'action.active',
          },
        }}
      >
        <Iconify icon="eva:search-fill" />
      </Box>

      <Label
        sx={{
          color: 'grey.800',
          cursor: 'inherit',
          bgcolor: 'common.white',
          fontSize: theme.typography.pxToRem(12),
          boxShadow: theme.vars.customShadows.z1,
          display: { xs: 'none', [breakpoint]: 'inline-flex' },
        }}
      >
        ⌘K
      </Label>
    </Box>
  );

  // 渲染搜索结果列表，保留原始样式，去掉图标，高亮仅加粗，单曲显示“歌名 - 歌手名”
  const renderList = () => (
    <MenuList
      disablePadding
      sx={{
        [`& .${menuItemClasses.root}`]: {
          p: 0,
          mb: 0,
          '&:hover': { bgcolor: 'transparent' },
        },
      }}
    >
      {searchResults.map((item) => {
        const typeLabel = typeLabels[item.type] || item.type;
        // 单曲显示“歌名 - 歌手名”，其他类型直接用 title
        const displayTitle =
          item.type === 'track' && item.artist_name
            ? `${item.title} - ${item.artist_name}`
            : item.title;
        const partsTitle = parse(displayTitle, match(displayTitle, searchQuery));
        const partsPath = parse(item.path, match(item.path, searchQuery));

        return (
          <MenuItem disableRipple key={`${item.id}-${item.type}`}>
            <Box
              sx={{
                py: 1,
                px: 2,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                textDecoration: 'none', // 去掉下划线
                color: 'text.primary', // 确保默认颜色
                '&:hover': {
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08), // 原始悬停背景
                },
              }}
              component="a"
              href={item.path}
              onClick={handleClose}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" color="text.primary">
                  {partsTitle.map((part, index) => (
                    <span
                      key={index}
                      style={{ fontWeight: part.highlight ? 'bold' : 'normal' }}
                    >
                      {part.text}
                    </span>
                  ))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {partsPath.map((part, index) => (
                    <span
                      key={index}
                      style={{ fontWeight: part.highlight ? 'bold' : 'normal' }}
                    >
                      {part.text}
                    </span>
                  ))}
                </Typography>
              </Box>
              <Label
                variant="soft"
                sx={{
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
                  color: 'text.secondary',
                }}
              >
                {typeLabel}
              </Label>
            </Box>
          </MenuItem>
        );
      })}
    </MenuList>
  );

  return (
    <>
      {renderButton()}

      <Dialog
        fullWidth
        closeAfterTransition
        maxWidth="sm"
        open={open}
        onClose={handleClose}
        transitionDuration={{ enter: theme.transitions.duration.shortest, exit: 100 }}
        sx={[
          {
            [`& .${dialogClasses.paper}`]: { mt: 15, overflow: 'unset' },
            [`& .${dialogClasses.container}`]: { alignItems: 'flex-start' },
          },
        ]}
      >
        <InputBase
          fullWidth
          autoFocus={open}
          placeholder="搜索单曲、专辑、艺术家..."
          value={searchQuery}
          onChange={handleSearch}
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={24} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          }
          endAdornment={<Label sx={{ letterSpacing: 1, color: 'text.secondary' }}>esc</Label>}
          inputProps={{ id: 'search-input' }}
          sx={{
            p: 3,
            borderBottom: `solid 1px ${theme.vars.palette.divider}`,
            [`& .${inputBaseClasses.input}`]: { typography: 'h6' },
          }}
        />

        {isLoading ? (
          <Box sx={{ py: 15, px: 2.5, textAlign: 'center' }}>
            <Typography variant="body1">加载中...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: 15, px: 2.5, textAlign: 'center' }}>
            <Typography variant="body1" color="error">
              搜索失败: {error}
            </Typography>
          </Box>
        ) : notFound ? (
          <SearchNotFound query={searchQuery} sx={{ py: 15, px: 2.5 }} />
        ) : (
          <Scrollbar sx={{ p: 2.5, height: 400 }}>{renderList()}</Scrollbar>
        )}
      </Dialog>
    </>
  );
}
