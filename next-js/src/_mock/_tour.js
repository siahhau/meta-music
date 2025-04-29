import { _mock } from './_mock';
import { _tags } from './assets';

// ----------------------------------------------------------------------

export const TOUR_DETAILS_TABS = [
  { label: '旅游内容', value: 'content' },
  { label: '预订者', value: 'bookers' },
];

export const TOUR_SORT_OPTIONS = [
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'popular' },
  { label: '最旧', value: 'oldest' },
];

export const TOUR_PUBLISH_OPTIONS = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
];

export const TOUR_SERVICE_OPTIONS = [
  { label: '语音导览', value: 'Audio guide' },
  { label: '餐饮', value: 'Food and drinks' },
  { label: '午餐', value: 'Lunch' },
  { label: '私人旅游', value: 'Private tour' },
  { label: '特别活动', value: 'Special activities' },
  { label: '门票', value: 'Entrance fees' },
  { label: '小费', value: 'Gratuities' },
  { label: '接送服务', value: 'Pick-up and drop off' },
  { label: '专业导游', value: 'Professional guide' },
  { label: '空调交通', value: 'Transport by air-conditioned' },
];

const CONTENT = `
<h6>描述</h6>

<p>偶尔会有些许责难和痛苦。自动产生痛苦的行为本身就是一种快乐。确实是公正的存在，除了那些容易被拒绝的快乐之外。所有的快乐都不会被指责为痛苦，应当被归咎于那些应得的。</p>

<h6>亮点</h6>

<ul>
  <li>发酵工艺在莫比预设的装饰性设计中，完成临时任务。</li>
  <li>普尔维纳放置在阿梅特，洛雷姆尼塞尔。</li>
  <li>结果是习惯性怀孕的奎斯克精英书目ID装饰性设计。</li>
  <li>埃蒂亚姆杜伊斯狼人在名声中，优越的舒适感。</li>
</ul>

<h6>行程</h6>

<p>
  <strong>第一天</strong>
</p>

<p>阿梅特最小化莫利特非描述性乌拉姆科，坐在阿利夸痛苦中做阿梅特辛特。维利特官方结果杜伊斯恩尼姆维利特莫利特。运动结果圣诺斯特鲁德阿梅特。</p>

<p>
  <strong>第二天</strong>
</p>

<p>阿梅特最小化莫利特非描述性乌拉姆科，坐在阿利夸痛苦中做阿梅特辛特。维利特官方结果杜伊斯恩尼姆维利特莫利特。运动结果圣诺斯特鲁德阿梅特。</p>

<p>
  <strong>第三天</strong>
</p>

<p>阿梅特最小化莫利特非描述性乌拉姆科，坐在阿利夸痛苦中做阿梅特辛特。维利特官方结果杜伊斯恩尼姆维利特莫利特。运动结果圣诺斯特鲁德阿梅特。</p>
`;

const BOOKER = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  guests: index + 10,
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
}));

export const _tourGuides = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
  phoneNumber: _mock.phoneNumber(index),
}));

export const TRAVEL_IMAGES = Array.from({ length: 16 }, (_, index) => _mock.image.travel(index));

export const _tours = Array.from({ length: 12 }, (_, index) => {
  const available = { startDate: _mock.time(index + 1), endDate: _mock.time(index) };

  const publish = index % 3 ? 'published' : 'draft';

  const services = (index % 2 && ['语音导览', '餐饮']) ||
    (index % 3 && ['午餐', '私人旅游']) ||
    (index % 4 && ['特别活动', '门票']) || [
      '小费',
      '接送服务',
      '专业导游',
      '空调交通',
    ];

  const tourGuides =
    (index === 0 && _tourGuides.slice(0, 1)) ||
    (index === 1 && _tourGuides.slice(1, 3)) ||
    (index === 2 && _tourGuides.slice(2, 5)) ||
    (index === 3 && _tourGuides.slice(4, 6)) ||
    _tourGuides.slice(6, 9);

  const images = TRAVEL_IMAGES.slice(index, index + 5);

  return {
    images,
    publish,
    services,
    available,
    tourGuides,
    bookers: BOOKER,
    content: CONTENT,
    id: _mock.id(index),
    tags: _tags.slice(0, 5),
    name: _mock.tourName(index),
    createdAt: _mock.time(index),
    durations: '4天3晚',
    price: _mock.number.price(index),
    destination: _mock.countryNames(index),
    priceSale: _mock.number.price(index),
    totalViews: _mock.number.nativeL(index),
    ratingNumber: _mock.number.rating(index),
  };
});
