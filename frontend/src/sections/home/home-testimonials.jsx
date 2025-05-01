import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fToNow } from 'src/utils/format-time';

import { _mock } from 'src/_mock';

import { varFade, MotionViewport, AnimateCountUp } from 'src/components/animate';
import {
  Carousel,
  useCarousel,
  CarouselDotButtons,
  carouselBreakpoints,
  CarouselArrowBasicButtons,
} from 'src/components/carousel';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatTriangleDownIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

// 渲染装饰线条和图标
const renderLines = () => (
  <>
    <Stack
      spacing={8}
      alignItems="center"
      sx={{
        top: 64,
        left: 80,
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

// 主组件：乐谱库首页用户评价区
export function HomeTestimonials({ sx, ...other }) {
  const carousel = useCarousel({
    align: 'start',
    slidesToShow: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
    },
    breakpoints: {
      [carouselBreakpoints.sm]: { slideSpacing: '24px' },
      [carouselBreakpoints.md]: { slideSpacing: '40px' },
      [carouselBreakpoints.lg]: { slideSpacing: '64px' },
    },
  });

  // 渲染描述
  const renderDescription = () => (
    <SectionTitle
      caption="用户评价"
      title="音乐创作者"
      txtGradient="的反馈"
      sx={{ mb: { xs: 5, md: 8 }, textAlign: 'center' }}
    />
  );

  // 渲染水平分隔线
  const horizontalDivider = (position) => (
    <Divider
      component="div"
      sx={[
        (theme) => ({
          width: 1,
          opacity: 0.16,
          height: '1px',
          border: 'none',
          position: 'absolute',
          background: `linear-gradient(to right, transparent 0%, ${theme.vars.palette.grey[500]} 50%, transparent 100%)`,
          ...(position === 'top' && { top: 0 }),
          ...(position === 'bottom' && { bottom: 0 }),
        }),
      ]}
    />
  );

  // 渲染垂直分隔线
  const verticalDivider = () => (
    <Divider
      component="div"
      orientation="vertical"
      flexItem
      sx={[
        (theme) => ({
          width: '1px',
          opacity: 0.16,
          border: 'none',
          background: `linear-gradient(to bottom, transparent 0%, ${theme.vars.palette.grey[500]} 50%, transparent 100%)`,
          display: { xs: 'none', md: 'block' },
        }),
      ]}
    />
  );

  // 渲染评价内容
  const renderContent = () => (
    <Stack sx={{ position: 'relative', py: { xs: 5, md: 8 } }}>
      {horizontalDivider('top')}

      <Carousel carousel={carousel}>
        {TESTIMONIALS.map((item) => (
          <Stack key={item.id} component={m.div} variants={varFade('in')}>
            <Stack spacing={1} sx={{ typography: 'subtitle2' }}>
              <Rating size="small" name="read-only" value={item.rating} precision={0.5} readOnly />
              {item.category}
            </Stack>

            <Typography
              sx={(theme) => ({
                ...theme.mixins.maxLine({ line: 4, persistent: theme.typography.body1 }),
                mt: 2,
                mb: 3,
              })}
            >
              {item.content}
            </Typography>

            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar alt={item.name} src={item.avatar} sx={{ width: 48, height: 48 }} />
              <Stack sx={{ typography: 'subtitle1' }}>
                <Box component="span">{item.name}</Box>

                <Box component="span" sx={{ typography: 'body2', color: 'text.disabled' }}>
                  {fToNow(new Date(item.postedAt))}
                </Box>
              </Stack>
            </Box>
          </Stack>
        ))}
      </Carousel>

      <Box
        sx={{
          mt: { xs: 5, md: 8 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CarouselDotButtons
          variant="rounded"
          scrollSnaps={carousel.dots.scrollSnaps}
          selectedIndex={carousel.dots.selectedIndex}
          onClickDot={carousel.dots.onClickDot}
        />

        <CarouselArrowBasicButtons {...carousel.arrows} options={carousel.options} />
      </Box>
    </Stack>
  );

  // 渲染统计数据
  const renderNumber = () => (
    <Stack sx={{ py: { xs: 5, md: 8 }, position: 'relative' }}>
      {horizontalDivider('top')}

      <Stack
        divider={verticalDivider()}
        sx={{ gap: 5, flexDirection: { xs: 'column', md: 'row' } }}
      >
        {[
          { label: '购买订单', value: 12.121 },
          { label: '满意用户', value: 160 },
          { label: '评价评分', value: 4.9 },
        ].map((item) => (
          <Stack key={item.label} spacing={2} sx={{ textAlign: 'center', width: 1 }}>
            <m.div variants={varFade('inUp', { distance: 24 })}>
              <AnimateCountUp
                to={item.value}
                unit={item.label === '购买订单' ? 'k+' : '+'}
                toFixed={item.label === '满意用户' ? 0 : 1}
                sx={[
                  (theme) => ({
                    fontWeight: 'fontWeightBold',
                    fontSize: { xs: 40, md: 64 },
                    lineHeight: { xs: 50 / 40, md: 80 / 64 },
                    fontFamily: theme.typography.fontSecondaryFamily,
                  }),
                ]}
              />
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Box
                component="span"
                sx={[
                  (theme) => ({
                    ...theme.mixins.textGradient(
                      `90deg, ${theme.vars.palette.text.primary}, ${varAlpha(theme.vars.palette.text.primaryChannel, 0.2)}`
                    ),
                    opacity: 0.4,
                    typography: 'h6',
                  }),
                ]}
              >
                {item.label}
              </Box>
            </m.div>
          </Stack>
        ))}
      </Stack>

      {horizontalDivider('bottom')}
    </Stack>
  );

  return (
    <Box
      component="section"
      sx={[{ py: 10, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <MotionViewport>
        {renderLines()}

        <Container>
          {renderDescription()}
          {renderContent()}
          {renderNumber()}
        </Container>
      </MotionViewport>
    </Box>
  );
}

// ----------------------------------------------------------------------

// 创建评价数据
const createReview = (index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  avatar: _mock.image.avatar(index),
  rating: 5,
});

// 用户评价数据，改编为乐谱库相关
const TESTIMONIALS = [
  {
    ...createReview(1),
    category: '界面设计',
    content: `乐谱库的界面设计非常出色，音符和和弦编辑器直观易用，与开发团队的沟通也非常顺畅！我推荐这个工具给任何音乐创作项目，团队不断推出新功能并优化设计。我会继续使用他们的工具，并在其他项目中再次购买。`,
    postedAt: '2024-04-20 23:15:30',
  },
  {
    ...createReview(2),
    category: '创作体验',
    content: `太棒了！我从未尝试过如此完整的音乐创作工具，未来肯定会再次使用！`,
    postedAt: '2024-03-19 23:15:30',
  },
  {
    ...createReview(3),
    category: '代码质量',
    content: `干净且完整的代码和设计，感谢乐谱库团队！`,
    postedAt: '2023-04-19 23:15:30',
  },
  {
    ...createReview(4),
    category: '客户支持',
    content: `感谢乐谱库通过邮件提供的客户支持，我的问题得到了解决。而且代码质量也很高！`,
    postedAt: '2023-05-19 23:15:30',
  },
  {
    ...createReview(5),
    category: '客户支持',
    content: `乐谱库的工具非常美观，客户支持也很热情。不过，我希望能将组件和主题作为单独的项目提供。`,
    postedAt: '2023-06-19 23:15:30',
  },
  {
    ...createReview(6),
    category: '界面设计',
    content: `我自己永远无法创建出这么多精美的音乐创作组件！`,
    postedAt: '2023-07-19 23:15:30',
  },
  {
    ...createReview(7),
    category: '代码质量',
    content: `乐谱库的代码质量极佳，但作为个人用户，高级版本的价格对我来说稍高。尽管我非常想购买，但预算有限。`,
    postedAt: '2023-08-19 23:15:30',
  },
  {
    ...createReview(8),
    category: '可定制性',
    content: `设计和代码质量令人印象深刻。定期更新和出色的客户支持是主要优势。`,
    postedAt: '2023-09-19 23:15:30',
  },
];
