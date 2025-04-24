import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';

const ScoreList = () => {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [editScoreData, setEditScoreData] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/scores/');
        setScores(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || '无法加载谱子列表，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const handleDelete = async (scoreId) => {
    setConfirmAction({
      type: 'delete',
      scoreId,
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/api/scores/${scoreId}/`);
          setScores(scores.filter((score) => score.id !== scoreId));
          setOpenDialog(false);
          setError(null);
        } catch (err) {
          setError('删除乐谱失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
    setOpenDialog(true);
  };

  const handleEdit = (score) => {
    setEditingScoreId(score.id);
    setEditScoreData(JSON.stringify(score.score_data, null, 2));
  };

  const handleSaveEdit = async (scoreId) => {
    setConfirmAction({
      type: 'edit',
      scoreId,
      onConfirm: async () => {
        setLoading(true);
        try {
          const updatedScoreData = JSON.parse(editScoreData);
          await api.post(`/api/scores/${scoreId}/update/`, { score_data: updatedScoreData });
          setScores(
            scores.map((score) =>
              score.id === scoreId ? { ...score, score_data: updatedScoreData } : score
            )
          );
          setEditingScoreId(null);
          setEditScoreData('');
          setOpenDialog(false);
          setError(null);
        } catch (err) {
          setError('保存乐谱失败，请检查 JSON 格式或稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
    setOpenDialog(true);
  };

  const handleCancelEdit = () => {
    setEditingScoreId(null);
    setEditScoreData('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

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
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <h1 className="text-2xl font-bold mb-4">我的谱子</h1>
      {scores.length === 0 ? (
        <p className="text-gray-500">你还没有上传任何谱子。</p>
      ) : (
        <div className="overflow-x-auto">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>歌曲 Spotify ID</TableCell> {/* 新增列 */}
                  <TableCell>歌曲名称</TableCell>
                  <TableCell>上传时间</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>奖励价格</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell>{score.track_id}</TableCell> {/* 显示 track_id */}
                    <TableCell>{score.track_name}</TableCell>
                    <TableCell>
                      {format(new Date(score.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      {score.status === 'PENDING' && '待审核'}
                      {score.status === 'APPROVED' && '通过'}
                      {score.status === 'REJECTED' && '拒绝'}
                    </TableCell>
                    <TableCell>¥{score.reward.toFixed(2)}</TableCell>
                    <TableCell>
                      {editingScoreId === score.id ? (
                        <div className="flex flex-col gap-2">
                          <TextField
                            value={editScoreData}
                            onChange={(e) => setEditScoreData(e.target.value)}
                            multiline
                            rows={10}
                            fullWidth
                            variant="outlined"
                            className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleSaveEdit(score.id)}
                            >
                              保存
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Link
                            to={`/detail/track/${score.track_id}`}
                            className="text-blue-500 hover:underline"
                          >
                            查看详情
                          </Link>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(score)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDelete(score.id)}
                          >
                            删除
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {confirmAction?.type === 'delete' ? '确认删除' : '确认保存'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction?.type === 'delete'
              ? '您确定要删除此乐谱吗？此操作不可撤销。'
              : '您确定要保存此乐谱的更改吗？'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            取消
          </Button>
          <Button
            onClick={confirmAction?.onConfirm}
            color={confirmAction?.type === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScoreList;