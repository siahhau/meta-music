import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
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
import api from "../api";

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
        console.error("获取单曲详情失败:", err);
        setError("无法加载单曲详情，请稍后重试");
      }
    };
    fetchTrack();
  }, [id]);

  const handleFileDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const scoreData = JSON.parse(text);
      const payload = {
        track_id: id,
        score_data: scoreData,
      };
      await api.post("/api/scores/create/", payload);
      const response = await api.get(`/api/tracks/${id}/`);
      setTrackData(response.data);
    } catch (err) {
      console.error("上传歌谱失败:", err);
      setError("歌谱上传失败，请检查文件格式或稍后重试");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      "application/json": [".json"],
    },
  });

  // 格式化时长为 MM:SS
  const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // 解析调性
  const getKey = (scoreData) => {
    const key = scoreData?.keys?.[0];
    if (!key) return "未知";
    const tonic = key.tonic || "C";
    const scale = key.scale === "major" ? "大调" : "小调";
    return `${tonic} ${scale}`;
  };

  // 解析歌曲结构
  const getStructure = (scoreData) => {
    const sections = scoreData?.sections || [];
    if (!sections.length) return "未知";

    // 定义段落颜色映射
    const sectionColorMap = {
      Intro: "success",
      Verse: "primary",
      Chorus: "warning",
      Bridge: "info",
      Outro: "danger",
      Section: "secondary",
      Section2: "warning",
      Section3: "info",
      Section4: "primary",
    };

    return (
      <div className="flex flex-wrap gap-2">
        {sections.map((s, index) => {
          const color = sectionColorMap[s.name] || "default";
          return (
            <Badge key={index} size="sm" color={color}>
              {s.name}
            </Badge>
          );
        })}
      </div>
    );
  };

  // 解析和弦进行
  const getChordProgression = (scoreData, sectionName, similarAbsoluteTracks, similarRelativeTracks) => {
    const chords = scoreData?.chords || [];
    const key = scoreData?.keys?.[0];
    const sections = scoreData?.sections || [];
    const relativeChordsData = scoreData?.relative_chords || [];
    if (!chords.length || !key) return "无和弦";
  
    const majorScale = ["C", "D", "E", "F", "G", "A", "B"];
    const minorScale = ["C", "D", "Eb", "F", "G", "Ab", "Bb"];
    const tonicIndex = majorScale.indexOf(key.tonic || "C");
    const isMajor = key.scale === "major";
    const scale = isMajor ? majorScale : minorScale;
  
    const section = sections.find((s) =>
      s.name.toLowerCase().includes(sectionName.toLowerCase())
    );
    if (!section) return "未找到该段落";
  
    const nextSection = sections.find((s) => s.beat > section.beat);
    const startBeat = section.beat;
    const endBeat = nextSection ? nextSection.beat : Infinity;
    const filteredChords = chords.filter(
      (chord) => chord.beat >= startBeat && chord.beat < endBeat
    );
  
    const chordNames = filteredChords.map((chord) => {
      const rootIndex = (chord.root - 1 + tonicIndex) % 7;
      let chordName = scale[rootIndex];
      if (!isMajor && [3, 6, 7].includes(chord.root)) chordName += "m";
      if (chord.type === 7) chordName += "7";
      return chordName;
    });
  
    const uniqueChords = [...new Set(chordNames)];
  
    // 从 relative_chords 获取该段落的相对和弦
    const sectionRelative = relativeChordsData.find(
      (rc) => rc.section.toLowerCase().includes(sectionName.toLowerCase())
    );
    const uniqueRelativeChords = sectionRelative ? sectionRelative.chords : [];
  
    // 获取相似歌曲
    const sectionAbsoluteTracks = similarAbsoluteTracks.find(
      (st) => st.section.toLowerCase().includes(sectionName.toLowerCase())
    )?.tracks || [];
    const sectionRelativeTracks = similarRelativeTracks.find(
      (st) => st.section.toLowerCase().includes(sectionName.toLowerCase())
    )?.tracks || [];
  
    return uniqueChords.length ? (
      <Box>
        {/* 绝对和弦进行 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: '100px', color: "grey.600" }}
          >
            绝对和弦：
          </Typography>
          <div className="flex flex-wrap gap-2">
            {uniqueChords.map((chord, index) => {
              const baseChord = chord.replace(/[m7]/g, "");
              const color = chordColors[baseChord] || "#607D8B";
              return (
                <Button
                  key={index}
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: color,
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: color,
                      opacity: 0.9,
                    },
                    borderRadius: "16px",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    mr: 0.5,
                  }}
                >
                  {chord}
                </Button>
              );
            })}
          </div>
        </Box>
        {/* 绝对和弦相似歌曲 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: '100px', color: "grey.600" }}
          >
            相似的歌曲：
          </Typography>
          <div className="flex -space-x-2">
            {sectionAbsoluteTracks.length > 0 ? (
              sectionAbsoluteTracks.map((track, index) => (
                <Link
                  key={index}
                  to={`/detail/track/${track.spotify_id}`}
                  title={track.name}
                  className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
                >
                  <img
                    width={24}
                    height={24}
                    src={track.image_url || "/images/user/owner.jpg"}
                    alt={track.name}
                    className="w-full size-6"
                  />
                </Link>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "grey.600" }}>
                无相似歌曲
              </Typography>
            )}
          </div>
        </Box>
        {/* 相对和弦进行 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: '100px', color: "grey.600" }}
          >
            相对和弦：
          </Typography>
          <div className="flex flex-wrap gap-2">
            {uniqueRelativeChords.length ? (
              uniqueRelativeChords.map((number, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "#607D8B",
                    color: "#607D8B",
                    "&:hover": {
                      borderColor: "#607D8B",
                      backgroundColor: "rgba(96, 125, 139, 0.1)",
                    },
                    borderRadius: "16px",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    mr: 0.5,
                  }}
                >
                  {number}
                </Button>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "grey.600" }}>
                无相对和弦
              </Typography>
            )}
          </div>
        </Box>
        {/* 相对和弦相似歌曲 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: '100px', color: "grey.600" }}
          >
            相似的歌曲：
          </Typography>
          <div className="flex -space-x-2">
            {sectionRelativeTracks.length > 0 ? (
              sectionRelativeTracks.map((track, index) => (
                <Link
                  key={index}
                  to={`/detail/track/${track.spotify_id}`}
                  title={track.name}
                  className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
                >
                  <img
                    width={24}
                    height={24}
                    src={track.image_url || "/images/user/owner.jpg"}
                    alt={track.name}
                    className="w-full size-6"
                  />
                </Link>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "grey.600" }}>
                无相似歌曲
              </Typography>
            )}
          </div>
        </Box>
      </Box>
    ) : (
      "无和弦"
    );
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
      {track && (
        <div>
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
                  专辑：
                  {album && album.spotify_id ? (
                    <Link
                      to={`/detail/album/${album.spotify_id}`}
                      className="underline"
                    >
                      {album.name}
                    </Link>
                  ) : (
                    "无专辑信息"
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  时长：{formatDuration(track.duration_ms)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  时长（毫秒）：{track.duration_ms || "未知"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  曲目编号：{track.track_number || "未知"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  是否含明确内容：
                  <Badge
                    size="sm"
                    color={track.explicit ? "danger" : "success"}
                  >
                    {track.explicit ? "是" : "否"}
                  </Badge>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  流行度：{track.popularity || "未知"}
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    上传歌谱：
                  </p>
                  <div
                    {...getRootProps()}
                    className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10 transition cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 dark:border-gray-700 ${
                      isDragActive
                        ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                        : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                    }`}
                    id="demo-upload"
                  >
                    <input {...getInputProps()} />
                    <div className="dz-message flex flex-col items-center m-0!">
                      <div className="mb-[22px] flex justify-center">
                        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          <svg
                            className="fill-current"
                            width="29"
                            height="28"
                            viewBox="0 0 29 28"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                            />
                          </svg>
                        </div>
                      </div>
                      <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                        {isDragActive
                          ? "拖拽文件到这里"
                          : "拖拽文件到这里"}
                      </h4>
                      <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                        只支持JSON格式
                      </span>
                      <span className="font-medium underline text-theme-sm text-brand-500">
                        选择文件
                      </span>
                    </div>
                  </div>
                </div>
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
                        {getChordProgression(scoreData, "Intro")}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {getChordProgression(scoreData, "Verse")}
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
                                    src={
                                      similarTrack.image_url ||
                                      "/images/user/owner.jpg"
                                    }
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
        </div>
      )}
    </>
  );
}