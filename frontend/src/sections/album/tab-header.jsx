'use client';
import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function TabHeader({ commentsCount }) {
  const [value, setValue] = useState(0); // 默认选中第一个标签（详情）

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: 1,
        px: { md: 3 },
        py: 1,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.customShadows.z8,
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', md: 'flex-end' },
        }}
      >
        <Tab
          component="a"
          href="#details"
          label="详情"
          icon={<Iconify width={24} icon="uil:comment-alt-info" />}
          iconPosition="start"
          sx={{ minHeight: '48px' }}
        />
        <Tab
          component="a"
          href="#tracks"
          label="歌单"
          icon={<Iconify width={24} icon="fluent:list-28-regular" />}
          iconPosition="start"
          sx={{ minHeight: '48px' }}
        />
        <Tab
          component="a"
          href="#comments"
          label={`评论 (${commentsCount})`}
          icon={<Iconify width={24} icon="fluent:comment-24-regular" />}
          iconPosition="start"
          sx={{ minHeight: '48px' }}
        />
      </Tabs>
    </Box>
  );
}
