import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const _carouselsMembers = Array.from({ length: 6 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  role: _mock.role(index),
  avatarUrl: _mock.image.portrait(index),
}));

// ----------------------------------------------------------------------

export const _faqs = Array.from({ length: 8 }, (_, index) => ({
  id: _mock.id(index),
  value: `panel${index + 1}`,
  heading: `问题 ${index + 1}`,
  detail: _mock.description(index),
}));

// ----------------------------------------------------------------------

export const _addressBooks = Array.from({ length: 24 }, (_, index) => ({
  id: _mock.id(index),
  primary: index === 0,
  name: _mock.fullName(index),
  email: _mock.email(index + 1),
  fullAddress: _mock.fullAddress(index),
  phoneNumber: _mock.phoneNumber(index),
  company: _mock.companyNames(index + 1),
  addressType: index === 0 ? '家庭' : '办公室',
}));

// ----------------------------------------------------------------------

export const _contacts = Array.from({ length: 20 }, (_, index) => {
  const status =
    (index % 2 && 'online') || (index % 3 && 'offline') || (index % 4 && 'always') || 'busy';

  return {
    id: _mock.id(index),
    status,
    role: _mock.role(index),
    email: _mock.email(index),
    name: _mock.fullName(index),
    phoneNumber: _mock.phoneNumber(index),
    lastActivity: _mock.time(index),
    avatarUrl: _mock.image.avatar(index),
    address: _mock.fullAddress(index),
  };
});

// ----------------------------------------------------------------------

export const _notifications = Array.from({ length: 9 }, (_, index) => ({
  id: _mock.id(index),
  avatarUrl: [
    _mock.image.avatar(1),
    _mock.image.avatar(2),
    _mock.image.avatar(3),
    _mock.image.avatar(4),
    _mock.image.avatar(5),
    null,
    null,
    null,
    null,
    null,
  ][index],
  type: ['friend', 'project', 'file', 'tags', 'payment', 'order', 'delivery', 'chat', 'mail'][
    index
  ],
  category: [

    '沟通',
    '项目用户界面',
    '文件管理',
    '文件管理',
    '文件管理',
    '订单',
    '订单',
    '沟通',
    '沟通',
  ][index],
  isUnRead: _mock.boolean(index),
  createdAt: _mock.time(index),
  title:
    (index === 0 && `<p><strong>Deja Brady</strong> 发送了好友请求</p>`) ||
    (index === 1 &&
      `<p><strong>Jayvon Hull</strong> 在 <strong><a href='#'>Minimal UI</a></strong> 中提到你</p>`) ||
    (index === 2 &&
      `<p><strong>Lainey Davidson</strong> 添加了文件到 <strong><a href='#'>文件管理</a></strong></p>`) ||
    (index === 3 &&
      `<p><strong>Angelique Morse</strong> 为 <strong><a href='#'>文件管理<a/></strong> 添加了新标签</p>`) ||
    (index === 4 &&
      `<p><strong>Giana Brandt</strong> 请求支付 <strong>$200</strong></p>`) ||
    (index === 5 && `<p>您的订单已下单，等待发货</p>`) ||
    (index === 6 && `<p>物流处理中，您的订单正在发货</p>`) ||
    (index === 7 && `<p>您有新消息，5条未读消息</p>`) ||
    (index === 8 && `<p>您有新邮件</p>`) ||
    '',
}));

// ----------------------------------------------------------------------

export const _mapContact = [
  { latlng: [33, 65], address: _mock.fullAddress(1), phoneNumber: _mock.phoneNumber(1) },
  { latlng: [-12.5, 18.5], address: _mock.fullAddress(2), phoneNumber: _mock.phoneNumber(2) },
];

// ----------------------------------------------------------------------

export const _socials = [
  {
    value: 'facebook',
    label: 'Facebook',
    path: 'https://www.facebook.com/caitlyn.kerluke',
  },
  {
    value: 'instagram',
    label: 'Instagram',
    path: 'https://www.instagram.com/caitlyn.kerluke',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    path: 'https://www.linkedin.com/caitlyn.kerluke',
  },
  {
    value: 'twitter',
    label: 'Twitter',
    path: 'https://www.twitter.com/caitlyn.kerluke',
  },
];

// ----------------------------------------------------------------------

export const _pricingPlans = [
  {
    subscription: 'basic',
    price: 0,
    caption: '永久免费',
    lists: ['3个原型', '3个面板', '最多5名团队成员'],
    labelAction: '当前计划',
  },
  {
    subscription: 'starter',
    price: 4.99,
    caption: '每年节省$24',
    lists: [
      '3个原型',
      '3个面板',
      '最多5名团队成员',
      '高级安全',
      '问题升级',
    ],
    labelAction: '选择初级计划',
  },
  {
    subscription: 'premium',
    price: 9.99,
    caption: '每年节省$124',
    lists: [
      '3个原型',
      '3个面板',
      '最多5名团队成员',
      '高级安全',
      '问题升级',
      '问题开发许可',
      '权限和工作流程',
    ],
    labelAction: '选择高级计划',
  },
];

// ----------------------------------------------------------------------

export const _testimonials = [
  {
    name: _mock.fullName(1),
    postedDate: _mock.time(1),
    ratingNumber: _mock.number.rating(1),
    avatarUrl: _mock.image.avatar(1),
    content: `出色的工作！非常感谢！`,
  },
  {
    name: _mock.fullName(2),
    postedDate: _mock.time(2),
    ratingNumber: _mock.number.rating(2),
    avatarUrl: _mock.image.avatar(2),
    content: `这是一个非常棒的仪表板，我们非常喜欢这个产品。我们做了一些调整，比如迁移到TypeScript并实现了一个React useContext API，以适应我们的工作方法，但这个产品在设计和应用架构方面是最好的之一。团队做得非常好。`,
  },
  {
    name: _mock.fullName(3),
    postedDate: _mock.time(3),
    ratingNumber: _mock.number.rating(3),
    avatarUrl: _mock.image.avatar(3),
    content: `客户支持非常快速且有帮助，这个主题的设计看起来很棒，代码也非常干净和易读，干得漂亮！`,
  },
  {
    name: _mock.fullName(4),
    postedDate: _mock.time(4),
    ratingNumber: _mock.number.rating(4),
    avatarUrl: _mock.image.avatar(4),
    content: `惊艳，代码质量非常好，提供了很多实现示例。`,
  },
  {
    name: _mock.fullName(5),
    postedDate: _mock.time(5),
    ratingNumber: _mock.number.rating(5),
    avatarUrl: _mock.image.avatar(5),
    content: `购买产品后有一些问题，卖家回复非常快且非常有帮助。总体来说，代码非常优秀，运行得很好。5/5星！`,
  },
  {
    name: _mock.fullName(6),
    postedDate: _mock.time(6),
    ratingNumber: _mock.number.rating(6),
    avatarUrl: _mock.image.avatar(6),
    content: `这里是Codealy.io的CEO。我们构建了一个有意义的开发者评估平台——任务基于git仓库并在虚拟机中运行。我们自动化了痛点——存储候选人代码、运行代码并与整个团队远程共享测试结果。购买这个模板是因为我们需要为早期客户提供一个出色的仪表板。我对这次购买非常满意。代码和设计一样出色。谢谢！`,
  },
];
