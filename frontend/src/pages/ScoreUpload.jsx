import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function ScoreUpload() {
  const [trackId, setTrackId] = useState('');
  const [scoreFile, setScoreFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 1024 * 1024) {
      setError('文件大小不能超过 1MB');
      return;
    }
    setScoreFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackId || !scoreFile) {
      setError('请填写歌曲 ID 并选择 JSON 文件');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const scoreData = JSON.parse(event.target.result);
          const response = await api.post('/api/scores/', {
            track_id: trackId,
            score_data: scoreData,
          });
          setSuccess('歌谱上传成功！');
          setError(null);
          setTimeout(() => navigate('/'), 2000);
        } catch (err) {
          console.error('上传失败:', err);
          setError('上传失败，请检查歌曲 ID 或 JSON 格式');
          setSuccess(null);
        }
      };
      reader.readAsText(scoreFile);
    } catch (err) {
      console.error('文件读取失败:', err);
      setError('文件读取失败，请选择有效 JSON 文件');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">上传歌谱</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">歌曲 ID (Spotify ID)</label>
          <input
            type="text"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="请输入歌曲 Spotify ID"
            className="border p-2 w-full rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">歌谱 JSON 文件</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="border p-2 w-full"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">上传</button>
      </form>
    </div>
  );
}

export default ScoreUpload;