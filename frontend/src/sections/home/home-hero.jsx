import { useRef, useState } from 'react';
import { m, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar, { avatarClasses } from '@mui/material/Avatar';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { _mock } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';

import { HeroBackground } from './components/hero-background';

// ----------------------------------------------------------------------

const smKey = 'sm';
const mdKey = 'md';
const lgKey = 'lg';

const motionProps = {
  variants: varFade('inUp', { distance: 24 }), // 动画属性，向上渐显
};

// 主组件：乐谱库首页英雄区
export function HomeHero({ sx, ...other }) {
  const scrollProgress = useScrollPercent(); // 跟踪滚动进度

  const mdUp = useMediaQuery((theme) => theme.breakpoints.up(mdKey)); // 检查是否为中大型屏幕

  const distance = mdUp ? scrollProgress.percent : 0; // 根据屏幕大小调整动画距离

  // 定义视差动画的 Y 轴偏移
  const y1 = useTransformY(scrollProgress.scrollY, distance * -7);
  const y2 = useTransformY(scrollProgress.scrollY, distance * -6);
  const y3 = useTransformY(scrollProgress.scrollY, distance * -5);
  const y4 = useTransformY(scrollProgress.scrollY, distance * -4);
  const y5 = useTransformY(scrollProgress.scrollY, distance * -3);

  // 根据滚动控制透明度
  const opacity = useTransform(
    scrollProgress.scrollY,
    [0, 1],
    [1, mdUp ? Number((1 - scrollProgress.percent / 100).toFixed(1)) : 1]
  );

  // 渲染标题
  const renderHeading = () => (
    <m.div {...motionProps}>
      <Box
        component="h1"
        sx={[
          (theme) => ({
            my: 0,
            mx: 'auto',
            maxWidth: 680,
            display: 'flex',
            flexWrap: 'wrap',
            typography: 'h2',
            justifyContent: 'center',
            fontFamily: theme.typography.fontSecondaryFamily,
            [theme.breakpoints.up(lgKey)]: {
              fontSize: theme.typography.pxToRem(72),
              lineHeight: '90px',
            },
          }),
        ]}
      >
        <Box component="span" sx={{ width: 1, opacity: 0.24 }}>
          释放你的音乐创作
        </Box>
        灵感，使用
        <Box
          component={m.span}
          animate={{ backgroundPosition: '200% center' }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          sx={[
            (theme) => ({
              ...theme.mixins.textGradient(
                `300deg, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.warning.main} 25%, ${theme.vars.palette.primary.main} 50%, ${theme.vars.palette.warning.main} 75%, ${theme.vars.palette.primary.main} 100%`
              ),
              backgroundSize: '400%',
              ml: { xs: 0.75, md: 1, xl: 1.5 },
            }),
          ]}
        >
          乐谱库
        </Box>
      </Box>
    </m.div>
  );

  // 渲染描述文本
  const renderText = () => (
    <m.div {...motionProps}>
      <Typography
        variant="body2"
        sx={[
          (theme) => ({
            mx: 'auto',
            [theme.breakpoints.up(smKey)]: { whiteSpace: 'pre' },
            [theme.breakpoints.up(lgKey)]: { fontSize: 20, lineHeight: '36px' },
          }),
        ]}
      >
        {`你的音乐创作起点，基于强大的乐谱管理工具。\n轻松定制和弦、音符，快速创作优美旋律。`}
      </Typography>
    </m.div>
  );

  // 渲染用户评价
  const renderRatings = () => (
    <m.div {...motionProps}>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          typography: 'subtitle2',
          justifyContent: 'center',
        }}
      >
        <AvatarGroup sx={{ [`& .${avatarClasses.root}`]: { width: 32, height: 32 } }}>
          {Array.from({ length: 3 }, (_, index) => (
            <Avatar
              key={_mock.fullName(index + 1)}
              alt={_mock.fullName(index + 1)}
              src={_mock.image.avatar(index + 1)}
            />
          ))}
        </AvatarGroup>
        160+ 满意的音乐创作者
      </Box>
    </m.div>
  );

  // 渲染操作按钮
  const renderButtons = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      <m.div {...motionProps}>
        <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
          <Button
            component={RouterLink}
            href={paths.dashboard.root}
            color="inherit"
            size="large"
            variant="contained"
            startIcon={<Iconify width={24} icon="custom:flash-outline" />}
          >
            <span>
              进入数据库
              <Box
                component="small"
                sx={[
                  (theme) => ({
                    mt: '-3px',
                    opacity: 0.64,
                    display: 'flex',
                    fontSize: theme.typography.pxToRem(10),
                    fontWeight: theme.typography.fontWeightMedium,
                  }),
                ]}
              >
                v{CONFIG.appVersion}
              </Box>
            </span>
          </Button>
        </Stack>
      </m.div>
    </Box>
  );

  return (
    <Box
      ref={scrollProgress.elementRef}
      component="section"
      sx={[
        (theme) => ({
          overflow: 'hidden',
          position: 'relative',
          [theme.breakpoints.up(mdKey)]: {
            minHeight: 760,
            height: '100vh',
            maxHeight: 1440,
            display: 'block',
            willChange: 'opacity',
            mt: 'calc(var(--layout-header-desktop-height) * -1)',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component={m.div}
        style={{ opacity }}
        sx={[
          (theme) => ({
            width: 1,
            display: 'flex',
            position: 'relative',
            flexDirection: 'column',
            transition: theme.transitions.create(['opacity']),
            [theme.breakpoints.up(mdKey)]: {
              height: 1,
              position: 'fixed',
              maxHeight: 'inherit',
            },
          }),
        ]}
      >
        <Container
          component={MotionContainer}
          sx={[
            (theme) => ({
              py: 3,
              gap: 5,
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              [theme.breakpoints.up(mdKey)]: {
                flex: '1 1 auto',
                justifyContent: 'center',
                py: 'var(--layout-header-desktop-height)',
              },
            }),
          ]}
        >
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <m.div style={{ y: y1 }}>{renderHeading()}</m.div>
            <m.div style={{ y: y2 }}>{renderText()}</m.div>
          </Stack>

          <m.div style={{ y: y3 }}>{renderRatings()}</m.div>
          <m.div style={{ y: y4 }}>{renderButtons()}</m.div>
        </Container>

        <HeroBackground />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

// 工具函数：转换 Y 轴动画
function useTransformY(value, distance) {
  const physics = {
    mass: 0.1,
    damping: 20,
    stiffness: 300,
    restDelta: 0.001,
  };

  return useSpring(useTransform(value, [0, 1], [0, distance]), physics);
}

// 工具函数：计算滚动百分比
function useScrollPercent() {
  const elementRef = useRef(null);

  const { scrollY } = useScroll();

  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollY, 'change', (scrollHeight) => {
    let heroHeight = 0;

    if (elementRef.current) {
      heroHeight = elementRef.current.offsetHeight;
    }

    const scrollPercent = Math.floor((scrollHeight / heroHeight) * 100);

    if (scrollPercent >= 100) {
      setPercent(100);
    } else {
      setPercent(Math.floor(scrollPercent));
    }
  });

  return { elementRef, percent, scrollY };
}
