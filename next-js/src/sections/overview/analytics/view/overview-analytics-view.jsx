'use client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  _analyticTasks,
  _analyticPosts,
  _analyticTraffic,
  _analyticOrderTimeline,
} from 'src/_mock';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        嗨，欢迎回来 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="周销售额"
            percent={2.6}
            total={714000}
            icon={
              <img
                alt="周销售额"
                src={`${CONFIG.assetsDir}/assets/icons/glass/ic-glass-bag.svg`}
              />
            }
            chart={{
              categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="新用户"
            percent={-0.1}
            total={1352831}
            color="secondary"
            icon={
              <img
                alt="新用户"
                src={`${CONFIG.assetsDir}/assets/icons/glass/ic-glass-users.svg`}
              />
            }
            chart={{
              categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月'],
              series: [56, 47, 40, 62, 73, 30, 23, 54],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="购买订单"
            percent={2.8}
            total={1723315}
            color="warning"
            icon={
              <img
                alt="购买订单"
                src={`${CONFIG.assetsDir}/assets/icons/glass/ic-glass-buy.svg`}
              />
            }
            chart={{
              categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="消息"
            percent={3.6}
            total={234}
            color="error"
            icon={
              <img
                alt="消息"
                src={`${CONFIG.assetsDir}/assets/icons/glass/ic-glass-message.svg`}
              />
            }
            chart={{
              categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="当前访问量"
            chart={{
              series: [
                { label: '美洲', value: 3500 },
                { label: '亚洲', value: 2500 },
                { label: '欧洲', value: 1500 },
                { label: '非洲', value: 500 },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsWebsiteVisits
            title="网站访问量"
            subheader="比去年增加43%"
            chart={{
              categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月'],
              series: [
                { name: '团队 A', data: [43, 33, 22, 37, 67, 68, 37, 24, 55] },
                { name: '团队 B', data: [51, 70, 47, 67, 40, 37, 24, 70, 24] },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsConversionRates
            title="转化率"
            subheader="比去年增加43%"
            chart={{
              categories: ['意大利', '日本', '中国', '加拿大', '法国'],
              series: [
                { name: '2022', data: [44, 55, 41, 64, 22] },
                { name: '2023', data: [53, 32, 33, 52, 13] },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentSubject
            title="当前科目"
            chart={{
              categories: ['英语', '历史', '物理', '地理', '中文', '数学'],
              series: [
                { name: '系列 1', data: [80, 50, 30, 40, 100, 20] },
                { name: '系列 2', data: [20, 30, 40, 80, 20, 80] },
                { name: '系列 3', data: [44, 76, 78, 13, 43, 10] },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsNews title="新闻" list={_analyticPosts} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsOrderTimeline title="订单时间线" list={_analyticOrderTimeline} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsTrafficBySite title="按站点流量" list={_analyticTraffic} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsTasks title="任务" list={_analyticTasks} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
