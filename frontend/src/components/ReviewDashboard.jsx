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
import api from '../api';

export default function ReviewDashboard() {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await api.get(`/api/scores/review/?status=${statusFilter}`);
        setScores(response.data);
        setIsForbidden(false);
      } catch (err) {
        console.error('获取待审核歌谱失败:', err);
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError('您没有权限访问此页面，请联系管理员。');
        } else {
          setError('无法加载数据，请稍后重试');
        }
      }
    };
    fetchScores();
  }, [statusFilter]);

  const handleReview = async (scoreId, status, comments) => {
    try {
      await api.patch(`/api/scores/review/${scoreId}/`, { status, review_comments: comments });
      const response = await api.get(`/api/scores/review/?status=${statusFilter}`);
      setScores(response.data);
      setError(null);
    } catch (err) {
      console.error('审核失败:', err);
      setError('审核失败，请稍后重试');
    }
  };

  const handleMarkPaid = async (scoreId) => {
    try {
      await api.post(`/api/scores/mark-paid/${scoreId}/`);
      const response = await api.get(`/api/scores/review/?status=${statusFilter}`);
      setScores(response.data);
      setError(null);
    } catch (err) {
      console.error('标记支付失败:', err);
      setError('标记支付失败，请稍后重试');
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
        审核员仪表板
      </h1>
      <div className="mb-6 p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">筛选歌谱</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="PENDING">待审核</option>
          <option value="APPROVED">通过</option>
          <option value="REJECTED">拒绝</option>
        </select>
      </div>
      <div className="p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">歌谱审核列表</h2>
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">歌曲</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">歌手</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">上传者</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">上传时间</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">状态</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">报酬 (¥)</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">是否支付</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">操作</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {scores.map(score => (
              <TableRow key={score.id}>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Link to={`/detail/track/${score.track_id}`} className="underline">{score.track_name}</Link>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{score.artist_name}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{score.user || '-'}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{new Date(score.created_at).toLocaleString()}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={score.status === 'APPROVED' ? 'success' : score.status === 'PENDING' ? 'warning' : 'danger'}>
                    {score.status === 'APPROVED' ? '通过' : score.status === 'PENDING' ? '待审核' : '拒绝'}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {score.reward != null && !isNaN(parseFloat(score.reward)) ? parseFloat(score.reward).toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={score.is_paid ? 'success' : 'danger'}>{score.is_paid ? '是' : '否'}</Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {score.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(score.id, 'APPROVED', '')}
                        className="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleReview(score.id, 'REJECTED', prompt('请输入拒绝原因') || '未提供原因')}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        拒绝
                      </button>
                    </div>
                  ) : score.status === 'APPROVED' && !score.is_paid ? (
                    <button
                      onClick={() => handleMarkPaid(score.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      标记已支付
                    </button>
                  ) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}