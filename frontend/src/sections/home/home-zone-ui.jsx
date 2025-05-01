import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';
import { FloatLine, CircleSvg, FloatTriangleDownIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

// 渲染装饰线条和图标
const renderLines = () => (
  <>
    <Stack
      spacing={8}
      sx={{
        top: 64,
        left: 80,
        alignItems: 'center',
        position: 'absolute',
        transform: 'translateX(-50%)',
      }}
    >
      <FloatTriangleDownIcon sx={{ position: 'static', opacity: 0.12 }} />
      <FloatTriangleDownIcon
        sx={{
          width: 30,
          height: 15,
          opacity: 0.24,
          position: 'static',
        }}
      />
    </Stack>

    <FloatLine vertical sx={{ top: 0, left: 80 }} />
  </>
);

// 主组件：乐谱库首页登陆页面区
export function HomeMusicLanding({ sx, ...other }) {
  // 渲染描述
  const renderDescription = () => (
    <SectionTitle
      caption="寻找一个"
      title="音乐创作"
      txtGradient="登陆页面？"
      description="结合乐谱编辑器，打造卓越的音乐创作体验。"
      sx={{ textAlign: { xs: 'center', md: 'left' } }}
    />
  );

  // 渲染插图
  const renderImage = () => (
    <Stack
      component={m.div}
      variants={varFade('inDown', { distance: 24 })}
      sx={[
        (theme) => ({
          alignItems: 'flex-end',
          filter: `drop-shadow(0 24px 48px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)})`,
          ...theme.applyStyles('dark', {
            filter: `drop-shadow(0 24px 48px ${varAlpha(theme.vars.palette.common.blackChannel, 0.16)})`,
          }),
        }),
      ]}
    >
      <Box
        component="img"
        alt="音乐创作登陆页面"
        src={`${CONFIG.assetsDir}/assets/images/home/music-landing.webp`}
        sx={[
          (theme) => ({
            width: 720,
            objectFit: 'cover',
            aspectRatio: '16/10',
            borderRadius: '16px 16px 0 16px',
            border: `solid 2px ${theme.vars.palette.common.white}`,
          }),
        ]}
      />

      <Box sx={{ p: 0.5, bgcolor: 'common.white', borderRadius: '0 0 8px 8px' }}>
        <Button
          variant="contained"
          target="_blank"
          rel="noopener"
          href={paths.musicStore}
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          sx={{
            color: 'grey.800',
            bgcolor: 'common.white',
            '&:hover': { bgcolor: 'common.white' },
          }}
        >
          访问音乐创作页面
        </Button>
      </Box>
    </Stack>
  );

  return (
    <Box
      component="section"
      sx={[
        {
          pt: 10,
          position: 'relative',
          pb: { xs: 10, md: 20 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <MotionViewport>
        {renderLines()}

        <Container sx={{ position: 'relative' }}>
          <Grid container spacing={{ xs: 5, md: 8 }} sx={{ position: 'relative', zIndex: 9 }}>
            <Grid size={{ xs: 12, md: 6, lg: 5 }}>{renderDescription()}</Grid>
            <Grid size={{ xs: 12, md: 6, lg: 7 }}>{renderImage()}</Grid>
          </Grid>

          <CircleSvg variants={varFade('in')} sx={{ display: { xs: 'none', md: 'block' } }} />
        </Container>
      </MotionViewport>
    </Box>
  );
}
