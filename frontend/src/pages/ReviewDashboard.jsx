import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api';

export default function ReviewDashboard() {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [isForbidden, setIsForbidden] = useState(false);
  const [confirmData, setConfirmData] = useState({
    scoreId: null,
    status: '',
    comments: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [rejectComments, setRejectComments] = useState('');

  const fetchScores = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === 'ALL'
          ? '/api/scores/review/'
          : `/api/scores/review/?status=${statusFilter}`;
      const response = await api.get(url);
      setScores(response.data);
      setIsForbidden(false);
      setError(null);
    } catch (err) {
      console.error('获取待审核歌谱失败:', err);
      if (err.response?.status === 403) {
        setIsForbidden(true);
        setError('您没有权限访问此页面，请联系管理员。');
      } else {
        setError('无法加载数据，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [statusFilter]);

  const handleReview = async (scoreId, status, comments = '') => {
    setLoading(true);
    try {
      console.log('Sending PATCH request:', { scoreId, status, comments });
      await api.patch(`/api/scores/review/${scoreId}/`, {
        status,
        review_comments: comments,
      });
      console.log('PATCH successful, refreshing list');
      await fetchScores();
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('审核失败:', err);
      setError(`审核失败: ${err.response?.data?.detail || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (scoreId) => {
    setConfirmData({
      scoreId,
      status: 'MARK_PAID',
      comments: '',
    });
    setOpenDialog(true);
  };

  const handleConfirm = async () => {
    const { scoreId, status, comments } = confirmData;
    setLoading(true);
    try {
      if (status === 'MARK_PAID') {
        await api.post(`/api/scores/mark-paid/${scoreId}/`);
      } else {
        await api.patch(`/api/scores/review/${scoreId}/`, {
          status,
          review_comments: status === 'REJECTED' ? rejectComments : comments,
        });
      }
      await fetchScores();
      setOpenDialog(false);
      setRejectComments('');
      setError(null);
    } catch (err) {
      console.error('操作失败:', err);
      setError(`操作失败: ${err.response?.data?.detail || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (scoreId) => {
    setConfirmData({
      scoreId,
      status: 'REJECTED',
      comments: '',
    });
    setRejectComments('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRejectComments('');
  };

  // Define DataGrid columns
  const columns = [
    {
      field: 'track_name',
      headerName: '歌曲',
      width: 200,
      renderCell: (params) => (
        <Link to={`/detail/track/${params.row.track_id}`} className="underline">
          {params.value}
        </Link>
      ),
    },
    { field: 'artist_name', headerName: '歌手', width: 150 },
    {
      field: 'user',
      headerName: '上传者',
      width: 150,
      valueGetter: (params) => params.value || '-',
    },
    {
      field: 'created_at',
      headerName: '上传时间',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'status',
      headerName: '状态',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={
            params.value === 'APPROVED'
              ? '通过'
              : params.value === 'PENDING'
              ? '待审核'
              : '拒绝'
          }
          color={
            params.value === 'APPROVED'
              ? 'success'
              : params.value === 'PENDING'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'reward',
      headerName: '报酬 (¥)',
      width: 120,
      valueFormatter: (params) =>
        params.value != null && !isNaN(parseFloat(params.value))
          ? parseFloat(params.value).toFixed(2)
          : '0.00',
    },
    {
      field: 'is_paid',
      headerName: '是否支付',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? '是' : '否'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          {params.row.status === 'PENDING' ? (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => {
                  console.log('Opening Dialog for APPROVE');
                  setConfirmData({
                    scoreId: params.row.id,
                    status: 'APPROVED',
                    comments: '',
                  });
                  setOpenDialog(true);
                }}
              >
                通过
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => handleReject(params.row.id)}
              >
                拒绝
              </Button>
            </>
          ) : params.row.status === 'APPROVED' && !params.row.is_paid ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleMarkPaid(params.row.id)}
            >
              标记已支付
            </Button>
          ) : (
            '-'
          )}
        </div>
      ),
    },
  ];

  if (loading && !scores.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-5">
      {loading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
        审核员仪表板
      </h1>
      <div className="mb-6 p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
          筛选歌谱
        </h2>
        <FormControl variant="outlined" size="small" fullWidth>
          <InputLabel>状态</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="状态"
            className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <MenuItem value="ALL">所有</MenuItem>
            <MenuItem value="PENDING">待审核</MenuItem>
            <MenuItem value="APPROVED">通过</MenuItem>
            <MenuItem value="REJECTED">拒绝</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
          歌谱审核列表
        </h2>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={scores}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                color: 'text.primary',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'background.paper',
                color: 'text.primary',
              },
            }}
          />
        </div>
      </div>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {confirmData.status === 'APPROVED'
            ? '确认通过'
            : confirmData.status === 'REJECTED'
            ? '确认拒绝'
            : '确认支付'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmData.status === 'APPROVED'
              ? '您确定要通过此歌谱吗？'
              : confirmData.status === 'REJECTED'
              ? '请输入拒绝原因：'
              : '您确定要标记此歌谱报酬为已支付吗？'}
          </DialogContentText>
          {confirmData.status === 'REJECTED' && (
            <TextField
              autoFocus
              margin="dense"
              label="拒绝原因"
              type="text"
              fullWidth
              variant="outlined"
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
              placeholder="请输入拒绝原因"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            color={
              confirmData.status === 'REJECTED'
                ? 'error'
                : confirmData.status === 'APPROVED'
                ? 'success'
                : 'primary'
            }
            variant="contained"
            disabled={confirmData.status === 'REJECTED' && !rejectComments.trim()}
          >
            {confirmData.status === 'REJECTED' ? '拒绝' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}