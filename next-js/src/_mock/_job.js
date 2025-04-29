import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const JOB_DETAILS_TABS = [
  { label: '职位内容', value: 'content' },
  { label: '候选人', value: 'candidates' },
];

export const JOB_SKILL_OPTIONS = [
  '用户界面',
  '用户体验',
  'HTML',
  'JavaScript',
  'TypeScript',
  '沟通',
  '解决问题',
  '领导力',
  '时间管理',
  '适应能力',
  '协作',
  '创造力',
  '批判性思维',
  '技术技能',
  '客户服务',
  '项目管理',
  '问题诊断',
];

export const JOB_WORKING_SCHEDULE_OPTIONS = [
  '周一至周五',
  '周末可工作',
  '白班',
];

export const JOB_EMPLOYMENT_TYPE_OPTIONS = [
  { label: '全职', value: 'Full-time' },
  { label: '兼职', value: 'Part-time' },
  { label: '按需', value: 'On demand' },
  { label: '可协商', value: 'Negotiable' },
];

export const JOB_EXPERIENCE_OPTIONS = [
  { label: '无经验', value: 'No experience' },
  { label: '1年经验', value: '1 year exp' },
  { label: '2年经验', value: '2 year exp' },
  { label: '3年以上经验', value: '> 3 year exp' },
];

export const JOB_BENEFIT_OPTIONS = [
  { label: '免费停车', value: 'Free parking' },
  { label: '奖金提成', value: 'Bonus commission' },
  { label: '旅行', value: 'Travel' },
  { label: '设备支持', value: 'Device support' },
  { label: '医疗保健', value: 'Health care' },
  { label: '培训', value: 'Training' },
  { label: '健康保险', value: 'Health insurance' },
  { label: '退休计划', value: 'Retirement plans' },
  { label: '带薪休假', value: 'Paid time off' },
  { label: '弹性工作时间', value: 'Flexible work schedule' },
];

export const JOB_PUBLISH_OPTIONS = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
];

export const JOB_SORT_OPTIONS = [
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'popular' },
  { label: '最旧', value: 'oldest' },
];

const CANDIDATES = Array.from({ length: 12 }, (_, index) => ({
  id: _mock.id(index),
  role: _mock.role(index),
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
}));

const CONTENT = `
<h6>职位描述</h6>

<p>偶尔会有些许责难和痛苦。自动产生痛苦的行为本身就是一种快乐。确实是公正的存在，除了那些容易被拒绝的快乐之外。所有的快乐都不会被指责为痛苦，应当被归咎于那些应得的。</p>

<h6>主要职责</h6>

<ul>
  <li>与代理商合作进行设计图纸细节、报价和本地生产。</li>
  <li>制作橱窗展示、标牌、室内展示、平面图和特别促销展示。</li>
  <li>更改展示以推广新产品发布并反映节日或季节主题。</li>
  <li>规划和执行开店/翻新/关闭店铺的程序。</li>
  <li>跟进店铺维护程序并不断更新SKU进出情况。</li>
  <li>监控成本并在预算范围内工作。</li>
  <li>与供应商联络并采购元素。</li>
</ul>

<h6>为什么你会喜欢在这里工作</h6>

<ul>
  <li>与代理商合作进行设计图纸细节、报价和本地生产。</li>
  <li>制作橱窗展示、标牌、室内展示、平面图和特别促销展示。</li>
  <li>更改展示以推广新产品发布并反映节日或季节主题。</li>
  <li>规划和执行开店/翻新/关闭店铺的程序。</li>
  <li>跟进店铺维护程序并不断更新SKU进出情况。</li>
  <li>监控成本并在预算范围内工作。</li>
  <li>与供应商联络并采购元素。</li>
</ul>
`;

export const _jobs = Array.from({ length: 12 }, (_, index) => {
  const publish = index % 3 ? 'published' : 'draft';

  const salary = {
    type: (index % 5 && 'Custom') || 'Hourly',
    price: _mock.number.price(index),
    negotiable: _mock.boolean(index),
  };

  const benefits = JOB_BENEFIT_OPTIONS.slice(0, 3).map((option) => option.label);

  const experience =
    JOB_EXPERIENCE_OPTIONS.map((option) => option.label)[index] || JOB_EXPERIENCE_OPTIONS[1].label;

  const employmentTypes = (index % 2 && ['Part-time']) ||
    (index % 3 && ['On demand']) ||
    (index % 4 && ['Negotiable']) || ['Full-time'];

  const company = {
    name: _mock.companyNames(index),
    logo: _mock.image.company(index),
    phoneNumber: _mock.phoneNumber(index),
    fullAddress: _mock.fullAddress(index),
  };

  return {
    id: _mock.id(index),
    salary,
    publish,
    company,
    benefits,
    experience,
    employmentTypes,
    content: CONTENT,
    candidates: CANDIDATES,
    role: _mock.role(index),
    title: _mock.jobTitle(index),
    createdAt: _mock.time(index),
    expiredDate: _mock.time(index),
    skills: JOB_SKILL_OPTIONS.slice(0, 3),
    totalViews: _mock.number.nativeL(index),
    locations: [_mock.countryNames(1), _mock.countryNames(2)],
    workingSchedule: JOB_WORKING_SCHEDULE_OPTIONS.slice(0, 2),
  };
});
