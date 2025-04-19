import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import api from '../api';
import FileInput from '../components/form/input/FileInput';

export default function TrackDetail() {
  const { id } = useParams();
  const [trackData, setTrackData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await api.get(`/api/tracks/${id}/`);
        setTrackData(response.data);
      } catch (err) {
        console.error('获取单曲详情失败:', err);
        setError('无法加载单曲详情，请稍后重试');
      }
    };
    fetchTrack();
  }, [id]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const scoreData = JSON.parse(text);
      const payload = {
        track_id: id,
        score_data: scoreData
      };
      await api.post('/api/scores/', payload);
      const response = await api.get(`/api/tracks/${id}/`);
      setTrackData(response.data);
    } catch (err) {
      console.error('上传歌谱失败:', err);
      setError('歌谱上传失败，请检查文件格式或稍后重试');
    }
  };

  // 格式化时长为 MM:SS
  const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // 解析调性
  const getKey = (scoreData) => {
    const key = scoreData?.keys?.[0];
    if (!key) return '未知';
    const tonic = key.tonic || 'C';
    const scale = key.scale === 'major' ? '大调' : '小调';
    return `${tonic} ${scale}`;
  };

  // 解析歌曲结构
  const getStructure = (scoreData) => {
    const sections = scoreData?.sections || [];
    if (!sections.length) return '未知';
    const sectionMap = {
      'Intro': '前奏',
      'Section': '主歌',
      'Section2': '副歌',
      'Section3': '间奏',
      'Section4': '桥段',
      'Outro': '结尾'
    };
    return sections.map(s => sectionMap[s.name] || s.name).join(', ');
  };

  // 解析和弦进行
  const getChordProgression = (scoreData, sectionName = null) => {
    const chords = scoreData?.chords || [];
    const key = scoreData?.keys?.[0];
    const sections = scoreData?.sections || [];
    if (!chords.length || !key) return '未知';

    const majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const minorScale = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'];
    const tonicIndex = majorScale.indexOf(key.tonic || 'C');
    const isMajor = key.scale === 'major';
    const scale = isMajor ? majorScale : minorScale;

    let filteredChords = chords;
    if (sectionName) {
      const section = sections.find(s => s.name === sectionName);
      if (!section) return '未找到该段落';
      const nextSection = sections.find(s => s.beat > section.beat);
      const startBeat = section.beat;
      const endBeat = nextSection ? nextSection.beat : Infinity;
      filteredChords = chords.filter(chord => chord.beat >= startBeat && chord.beat < endBeat);
    }

    const chordNames = filteredChords.map(chord => {
      const rootIndex = (chord.root - 1 + tonicIndex) % 7;
      let chordName = scale[rootIndex];
      if (!isMajor && [3, 6, 7].includes(chord.root)) chordName += 'm';
      if (chord.type === 7) chordName += '7';
      return chordName;
    });

    const uniqueChords = [...new Set(chordNames)].slice(0, 10);
    return uniqueChords.join(', ');
  };

  // 获取音符总数
  const getNoteCount = (scoreData) => {
    return scoreData?.notes?.length || 0;
  };

  // 获取和弦总数
  const getChordCount = (scoreData) => {
    return scoreData?.chords?.length || 0;
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!trackData) {
    return <div className="p-4">加载中...</div>;
  }

  const track = trackData.track;
  const album = trackData.album;
  const hasScore = trackData.has_score;
  const scoreData = trackData.score_data;
  const similarTracks = trackData.similar_tracks || [];

  return (
    <>
      <PageMeta
        title={`${track.name} - 单曲详情`}
        description={`单曲 ${track.name} by ${track.artist_name}`}
      />
      <PageBreadcrumb pageTitle="单曲详情" />
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {track.name}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              歌手：{track.artist_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              专辑：<Link to={`/detail/album/${album.spotify_id}`} className="underline">{album.name}</Link>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              时长：{formatDuration(track.duration_ms)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              时长（毫秒）：{track.duration_ms || '未知'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              曲目编号：{track.track_number || '未知'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              是否含明确内容：<Badge size="sm" color={track.explicit ? "danger" : "success"}>
                {track.explicit ? "是" : "否"}
              </Badge>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              流行度：{track.popularity || '未知'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              上传歌谱：<FileInput onChange={handleFileChange} className="custom-class" />
            </p>
          </div>
        </div>
        {hasScore && scoreData && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              歌谱结构
            </h3>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    音符总数
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    和弦总数
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    歌曲结构
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    调性
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    整体和弦进行
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    前奏和弦进行
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    主歌和弦进行
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    相似歌曲
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                <TableRow>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getNoteCount(scoreData)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getChordCount(scoreData)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getStructure(scoreData)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getKey(scoreData)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getChordProgression(scoreData)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getChordProgression(scoreData, 'Intro')}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getChordProgression(scoreData, 'Section')}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="flex -space-x-2">
                      {similarTracks.length > 0 ? (
                        similarTracks.map((similarTrack, index) => (
                          <Link
                            key={index}
                            to={`/detail/track/${similarTrack.spotify_id}`}
                            title={similarTrack.name}
                          >
                            <div className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900">
                              <img
                                width={24}
                                height={24}
                                src={similarTrack.image_url || '/images/user/owner.jpg'}
                                alt={similarTrack.name}
                                className="w-full size-6"
                              />
                            </div>
                          </Link>
                        ))
                      ) : (
                        <span>无相似歌曲</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}