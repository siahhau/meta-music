import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import Chart from "react-apexcharts";
import { Dropdown } from './ui/dropdown/Dropdown';
import { DropdownItem } from './ui/dropdown/DropdownItem';
import { MoreDotIcon } from '../icons';
import api from '../api';

export default function TaskDashboard() {
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [isRewardDropdownOpen, setIsRewardDropdownOpen] = useState(false);
  const [isPassRateDropdownOpen, setIsPassRateDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const scoresResponse = await api.get('/api/scores/');
        setScores(scoresResponse.data);
        const statsResponse = await api.get(`/api/scores/stats/?days=${timeRange}`);
        setStats(statsResponse.data);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('无法加载数据，请稍后重试');
      }
    };
    fetchData();
  }, [timeRange]);

  const toggleRewardDropdown = () => setIsRewardDropdownOpen(!isRewardDropdownOpen);
  const closeRewardDropdown = () => setIsRewardDropdownOpen(false);
  const togglePassRateDropdown = () => setIsPassRateDropdownOpen(!isPassRateDropdownOpen);
  const closePassRateDropdown = () => setIsPassRateDropdownOpen(false);

  // 柱状图：近 30 天报酬
  const rewardChartOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: stats && stats.daily_stats ? Object.keys(stats.daily_stats).map(date => date.slice(5)) : [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val) => `¥${val.toFixed(2)}` },
    },
  };

  const rewardChartSeries = [
    {
      name: "每日报酬",
      data: stats && stats.daily_stats ? Object.values(stats.daily_stats).map(stat => Number(stat.reward) || 0) : [],
    },
  ];

  // 环形图：通过率
  const passRateChartOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["通过率"],
  };

  const passRateChartSeries = [stats && stats.pass_rate ? stats.pass_rate : 0];

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!stats) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
        数据标注师任务仪表板
      </h1>
      <div className="mb-6 p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">数据概览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">昨日上传数量</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{stats.yesterday_uploaded || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">昨日总报酬</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
              ¥{Number(stats.yesterday_reward || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">总报酬</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
              ¥{Number(stats.total_reward || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              近 {timeRange} 天报酬
            </h3>
            <div className="relative inline-block">
              <button className="dropdown-toggle" onClick={toggleRewardDropdown}>
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </button>
              <Dropdown isOpen={isRewardDropdownOpen} onClose={closeRewardDropdown} className="w-40 p-2">
                <DropdownItem
                  onItemClick={() => { setTimeRange('7'); closeRewardDropdown(); }}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  过去 7 天
                </DropdownItem>
                <DropdownItem
                  onItemClick={() => { setTimeRange('30'); closeRewardDropdown(); }}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  过去 30 天
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
              {rewardChartSeries[0].data.length > 0 ? (
                <Chart options={rewardChartOptions} series={rewardChartSeries} type="bar" height={180} />
              ) : (
                <p className="text-center text-gray-500 py-4">暂无报酬数据</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  近 {timeRange} 天通过率
                </h3>
                <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                  通过审核的歌谱比例
                </p>
              </div>
              <div className="relative inline-block">
                <button className="dropdown-toggle" onClick={togglePassRateDropdown}>
                  <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
                </button>
                <Dropdown isOpen={isPassRateDropdownOpen} onClose={closePassRateDropdown} className="w-40 p-2">
                  <DropdownItem
                    onItemClick={() => { setTimeRange('7'); closePassRateDropdown(); }}
                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    过去 7 天
                  </DropdownItem>
                  <DropdownItem
                    onItemClick={() => { setTimeRange('30'); closePassRateDropdown(); }}
                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    过去 30 天
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>
            <div className="relative">
              <Chart
                options={passRateChartOptions}
                series={passRateChartSeries}
                type="radialBar"
                height={330}
              />
              <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                {stats && stats.pass_rate > 0 ? `+${stats.pass_rate.toFixed(1)}%` : '0%'}
              </span>
            </div>
            <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
              {stats && stats.pass_rate > 0
                ? `你的歌谱通过率达到 ${stats.pass_rate.toFixed(1)}%，继续保持高质量！`
                : '暂无通过的歌谱，继续努力！'}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">历史上传记录</h2>
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                歌曲
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                歌手
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                上传时间
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                状态
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                报酬 (¥)
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                是否支付
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                审核备注
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {scores.map(score => (
              <TableRow key={score.id}>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Link to={`/detail/track/${score.track_id}`} className="underline">
                    {score.track_name}
                  </Link>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {score.artist_name}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {new Date(score.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={score.status === 'APPROVED' ? 'success' : score.status === 'PENDING' ? 'warning' : 'danger'}
                  >
                    {score.status === 'APPROVED' ? '通过' : score.status === 'PENDING' ? '待审核' : '拒绝'}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {score.reward != null && !isNaN(score.reward) ? Number(score.reward).toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={score.is_paid ? 'success' : 'danger'}>
                    {score.is_paid ? '是' : '否'}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {score.review_comments || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}