"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

// MIDI文件上传组件
const MidiUpload = ({ 
  spotifyId, 
  onSuccess, 
  onDelete,
  apiBaseUrl = 'http://localhost:8000'
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [midiInfo, setMidiInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  
  // 获取MIDI信息
  const fetchMidiInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/midis/info/${spotifyId}`);
      if (response.data.exists) {
        setMidiInfo(response.data.midi_info);
      } else {
        setMidiInfo(null);
      }
    } catch (error) {
      console.error('获取MIDI信息失败:', error);
      setMidiInfo(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时获取MIDI信息
  useEffect(() => {
    if (spotifyId) {
      fetchMidiInfo();
    }
  }, [spotifyId]);
  
  // 处理文件选择
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    // 检查文件类型 - 只接受.mid或.midi文件
    if (!selectedFile.name.toLowerCase().endsWith('.mid') && 
        !selectedFile.name.toLowerCase().endsWith('.midi')) {
      setError('只支持.mid或.midi格式的MIDI文件');
      return;
    }
    
    // 检查文件大小 - 限制为10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过10MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  // 处理删除文件
  const handleRemoveFile = () => {
    setFile(null);
    fileInputRef.current.value = '';
    setError(null);
  };
  
  // 打开上传对话框
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  // 关闭上传对话框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // 处理删除MIDI文件
  const handleDeleteMidi = async () => {
    setDeleteDialog(false);
    
    try {
      const response = await axios.delete(`${apiBaseUrl}/midis/delete/${spotifyId}`);
      if (response.status === 200) {
        setMidiInfo(null);
        if (onDelete) {
          onDelete();
        }
      }
    } catch (error) {
      console.error('删除MIDI文件失败:', error);
      setError('删除MIDI文件失败，请稍后重试');
    }
  };
  
  // 处理文件上传
  const handleUpload = async () => {
    if (!file || !spotifyId) return;
    
    setOpenDialog(false);
    setUploading(true);
    setProgress(0);
    setSuccess(false);
    
    const formData = new FormData();
    formData.append('midi_file', file);
    formData.append('description', description);
    formData.append('uploaded_by', username || 'anonymous');
    
    try {
      const response = await axios.post(`${apiBaseUrl}/midis/upload/${spotifyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });
      
      setSuccess(true);
      // 重新获取MIDI信息
      fetchMidiInfo();
      
      // 如果上传成功并有回调，则调用它
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('MIDI上传失败:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message || 
        '上传失败，请稍后重试'
      );
    } finally {
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setDescription('');
    }
  };
  
  // 下载MIDI文件
  const handleDownload = () => {
    if (!midiInfo) return;
    
    window.open(`${apiBaseUrl}/midis/download/${spotifyId}`, '_blank');
  };
  
  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          MIDI文件管理
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            MIDI文件上传成功！
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              加载中...
            </Typography>
          </Box>
        ) : midiInfo ? (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 1,
              mb: 2
            }}>
              <MusicNoteIcon color="primary" sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" gutterBottom>
                  {midiInfo.original_filename}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  大小: {(midiInfo.file_size / 1024).toFixed(1)} KB
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  上传时间: {new Date(midiInfo.created_at).toLocaleString()}
                </Typography>
                {midiInfo.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    描述: {midiInfo.description}
                  </Typography>
                )}
                {midiInfo.uploaded_by && midiInfo.uploaded_by !== 'anonymous' && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    上传者: {midiInfo.uploaded_by}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mr: 1 }}
              >
                下载MIDI
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
              >
                删除MIDI
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              mb: 2
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <CloudUploadIcon fontSize="large" color="primary" />
            <Typography variant="body1" sx={{ mt: 1 }}>
              点击选择MIDI文件或拖放文件到此处
            </Typography>
            <Typography variant="caption" color="text.secondary">
              支持.mid和.midi格式，最大10MB
            </Typography>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept=".mid,.midi"
              onChange={handleFileChange}
            />
          </Box>
        )}
        
        {file && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 1,
            }}>
              <MusicNoteIcon color="primary" sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                删除
              </Button>
            </Box>
            
            {uploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  上传中... {progress}%
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenDialog}
                disabled={uploading}
                startIcon={<CloudUploadIcon />}
              >
                上传MIDI文件
              </Button>
            </Box>
          </Box>
        )}
        
        {/* 确认上传对话框 */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>填写MIDI文件信息</DialogTitle>
          <DialogContent>
            <DialogContentText>
              请为MIDI文件添加额外信息（可选）:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="description"
              label="描述信息"
              type="text"
              fullWidth
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="username"
              label="您的用户名"
              type="text"
              fullWidth
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">取消</Button>
            <Button onClick={handleUpload} color="primary">上传</Button>
          </DialogActions>
        </Dialog>
        
        {/* 确认删除对话框 */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <DialogContentText>
              您确定要删除这个MIDI文件吗？此操作无法撤销。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)} color="inherit">取消</Button>
            <Button onClick={handleDeleteMidi} color="error">删除</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MidiUpload;