// src/api/chord.js
import axios from 'axios';

// 保存和弦进行到数据库
export const saveChordProgression = async (data) => {
  const { spotifyId, sectionName, sectionIndex, chordProgression } = data;

  try {
    const response = await axios.post(
      `http://localhost:8000/tracks/spotify/${spotifyId}/chord-progressions`, 
      {
        chordProgression,
        sectionName,
        sectionIndex
      }
    );

    return response.data;
  } catch (error) {
    console.error('保存和弦进行失败:', error);
    throw new Error(error.response?.data?.error || '保存失败，请稍后重试');
  }
};

// 获取歌曲的所有和弦进行
export const getChordProgressions = async (spotifyId) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/tracks/spotify/${spotifyId}/chord-progressions`
    );
    
    return response.data;
  } catch (error) {
    console.error('获取和弦进行失败:', error);
    throw new Error(error.response?.data?.error || '获取数据失败，请稍后重试');
  }
};