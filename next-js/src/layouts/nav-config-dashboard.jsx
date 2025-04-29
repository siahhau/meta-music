import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

/**
 * 导航数据是一个用于定义导航栏结构和内容的导航项数组。
 * 每个部分包含一个子标题和一个项目数组，项目可以包含嵌套的子项目。
 *
 * 每个项目可以具有以下属性：
 * - `title`：导航项目的标题。
 * - `path`：项目链接的URL路径。
 * - `icon`：可选的图标组件，显示在标题旁边。
 * - `info`：可选的附加信息，如标签。
 * - `allowedRoles`：可选的允许查看项目的角色数组。
 * - `caption`：可选的标题下方显示的说明。
 * - `children`：可选的嵌套导航项目数组。
 * - `disabled`：可选的布尔值，用于禁用项目。
 */
export const navData = [
  /**
   * 概览
   */
  {
    subheader: '概览',
    items: [
      { title: '应用', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: '电子商务', path: paths.dashboard.general.ecommerce, icon: ICONS.ecommerce },
      { title: '分析', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
      { title: '银行', path: paths.dashboard.general.banking, icon: ICONS.banking },
      { title: '预订', path: paths.dashboard.general.booking, icon: ICONS.booking },
      { title: '文件', path: paths.dashboard.general.file, icon: ICONS.file },
      { title: '课程', path: paths.dashboard.general.course, icon: ICONS.course },
    ],
  },
  /**
   * 管理
   */

  {
    subheader: '管理',
    items: [
      {
        title: '歌曲',
        path: paths.dashboard.track.root,
        icon: ICONS.blog,
        children: [
          { title: '列表', path: paths.dashboard.track.root },
        ],
      },
      {
        title: '歌谱',
        path: paths.dashboard.score.root,
        icon: ICONS.blog,
        children: [
          { title: '列表', path: paths.dashboard.score.root },
        ],
      },
      {
        title: '用户',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: '个人资料', path: paths.dashboard.user.root },
          { title: '卡片', path: paths.dashboard.user.cards },
          { title: '列表', path: paths.dashboard.user.list },
          { title: '创建', path: paths.dashboard.user.new },
          { title: '编辑', path: paths.dashboard.user.demo.edit },
          { title: '账户', path: paths.dashboard.user.account },
        ],
      },
      {
        title: '产品',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        children: [
          { title: '列表', path: paths.dashboard.product.root },
          { title: '详情', path: paths.dashboard.product.demo.details },
          { title: '创建', path: paths.dashboard.product.new },
          { title: '编辑', path: paths.dashboard.product.demo.edit },
        ],
      },
      {
        title: '订单',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        children: [
          { title: '列表', path: paths.dashboard.order.root },
          { title: '详情', path: paths.dashboard.order.demo.details },
        ],
      },
      {
        title: '发票',
        path: paths.dashboard.invoice.root,
        icon: ICONS.invoice,
        children: [
          { title: '列表', path: paths.dashboard.invoice.root },
          { title: '详情', path: paths.dashboard.invoice.demo.details },
          { title: '创建', path: paths.dashboard.invoice.new },
          { title: '编辑', path: paths.dashboard.invoice.demo.edit },
        ],
      },
      {
        title: '博客',
        path: paths.dashboard.post.root,
        icon: ICONS.blog,
        children: [
          { title: '列表', path: paths.dashboard.post.root },
          { title: '详情', path: paths.dashboard.post.demo.details },
          { title: '创建', path: paths.dashboard.post.new },
          { title: '编辑', path: paths.dashboard.post.demo.edit },
        ],
      },
      {
        title: '工作',
        path: paths.dashboard.job.root,
        icon: ICONS.job,
        children: [
          { title: '列表', path: paths.dashboard.job.root },
          { title: '详情', path: paths.dashboard.job.demo.details },
          { title: '创建', path: paths.dashboard.job.new },
          { title: '编辑', path: paths.dashboard.job.demo.edit },
        ],
      },
      {
        title: '旅游',
        path: paths.dashboard.tour.root,
        icon: ICONS.tour,
        children: [
          { title: '列表', path: paths.dashboard.tour.root },
          { title: '详情', path: paths.dashboard.tour.demo.details },
          { title: '创建', path: paths.dashboard.tour.new },
          { title: '编辑', path: paths.dashboard.tour.demo.edit },
        ],
      },
      { title: '文件管理器', path: paths.dashboard.fileManager, icon: ICONS.folder },
      {
        title: '邮件',
        path: paths.dashboard.mail,
        icon: ICONS.mail,
        info: (
          <Label color="error" variant="inverted">
            +32
          </Label>
        ),
      },
      { title: '聊天', path: paths.dashboard.chat, icon: ICONS.chat },
      { title: '日历', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: '看板', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
  /**
   * 其他
   */
  {
    subheader: '其他',
    items: [
      {
        /**
         * 每个项目的权限可以通过 `allowedRoles` 属性设置。
         * - 如果未设置 `allowedRoles`（默认），所有角色都可以看到该项目。
         * - 如果 `allowedRoles` 是一个空数组 `[]`，无人可以看到该项目。
         * - 如果 `allowedRoles` 包含特定角色，只有这些角色可以看到该项目。
         *
         * 示例：
         * - `allowedRoles: ['user']` - 仅具有“用户”角色的用户可以看到该项目。
         * - `allowedRoles: ['admin']` - 仅具有“管理员”角色的用户可以看到该项目。
         * - `allowedRoles: ['admin', 'manager']` - 仅具有“管理员”或“经理”角色的用户可以看到该项目。
         *
         * 可结合 `checkPermissions` 属性构建条件表达式。
         * 示例用法可在以下文件中找到：src/sections/_examples/extra/navigation-bar-view/nav-vertical.{jsx | tsx}
         */
        title: '权限',
        path: paths.dashboard.permission,
        icon: ICONS.lock,
        allowedRoles: ['admin', 'manager'],
        caption: '仅管理员可以看到此项目。',
      },
      {
        title: '层级',
        path: '#/dashboard/menu_level',
        icon: ICONS.menuItem,
        children: [
          {
            title: '层级 1a',
            path: '#/dashboard/menu_level/menu_level_1a',
            children: [
              { title: '层级 2a', path: '#/dashboard/menu_level/menu_level_1a/menu_level_2a' },
              {
                title: '层级 2b',
                path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b',
                children: [
                  {
                    title: '层级 3a',
                    path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b/menu_level_3a',
                  },
                  {
                    title: '层级 3b',
                    path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b/menu_level_3b',
                  },
                ],
              },
            ],
          },
          { title: '层级 1b', path: '#/dashboard/menu_level/menu_level_1b' },
        ],
      },
      {
        title: '禁用',
        path: '#disabled',
        icon: ICONS.disabled,
        disabled: true,
      },
      {
        title: '标签',
        path: '#label',
        icon: ICONS.label,
        info: (
          <Label
            color="info"
            variant="inverted"
            startIcon={<Iconify icon="solar:bell-bing-bold-duotone" />}
          >
            新
          </Label>
        ),
      },
      {
        title: '说明',
        path: '#caption',
        icon: ICONS.menuItem,
        caption:
          '曲折的道路通向成功，生活如同一场冒险。让我们勇敢面对挑战，创造属于自己的传奇！',
      },
      {
        title: '参数',
        path: '/dashboard/params?id=e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1',
        icon: ICONS.parameter,
      },
      {
        title: '外部链接',
        path: 'https://www.google.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
      { title: '空白', path: paths.dashboard.blank, icon: ICONS.blank },
    ],
  },
];
