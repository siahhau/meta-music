import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import api from "../api";
import chordColors from "../utils/chordColors";
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

export default function TrackDetail() {
  const { id } = useParams();
  const [trackData, setTrackData] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    key: { beat: 1, tonic: "C", scale: "major" },
    version: "1.0.0",
    tempo: { beat: 1, bpm: 107, swingFactor: 0, swingBeat: 0.5 },
    meter: { beat: 1, numBeats: 4, beatUnit: 1 },
  });
  const [formError, setFormError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [scoreId, setScoreId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scoreStatus, setScoreStatus] = useState(null); // 新增状态存储 status
  useEffect(() => {
    const fetchTrackAndUser = async () => {
      try {
        // 获取歌曲详情
        const response = await api.get(`/api/tracks/${id}/`);
        setTrackData(response.data);
        if (response.data.has_score && response.data.score_data) {
          setFormData({
            key: response.data.score_data.keys?.[0] || {
              beat: 1,
              tonic: "C",
              scale: "major",
            },
            version: response.data.score_data.version || "1.0.0",
            tempo: response.data.score_data.tempos?.[0] || {
              beat: 1,
              bpm: 107,
              swingFactor: 0,
              swingBeat: 0.5,
            },
            meter: response.data.score_data.meters?.[0] || {
              beat: 1,
              numBeats: 4,
              beatUnit: 1,
            },
          });
          setJsonData(JSON.stringify(response.data.score_data, null, 2));
          // 获取当前歌曲的 Score
          try {
            const scoresResponse = await api.get(`/api/scores/?track_id=${id}`);
            const userScore = scoresResponse.data[0];
            if (userScore) {
              setScoreId(userScore.id);
              setScoreStatus(userScore.status); // 设置 status
            }
          } catch (err) {
            console.error("获取乐谱失败:", err);
            setFormError("无法获取乐谱信息，请稍后重试");
          }
        }
        // 获取用户信息，检查是否为管理员
        try {
          const userResponse = await api.get("/api/user/");
          setIsAdmin(userResponse.data.is_staff);
        } catch (err) {
          console.error("获取用户信息失败:", err);
        }
      } catch (err) {
        console.error("获取单曲详情失败:", err);
        setError("无法加载单曲详情，请稍后重试");
      }
    };
    fetchTrackAndUser();
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
      setFormData({
        key: response.data.score_data.keys?.[0] || {
          beat: 1,
          tonic: "C",
          scale: "major",
        },
        version: response.data.score_data.version || "1.0.0",
        tempo: response.data.score_data.tempos?.[0] || {
          beat: 1,
          bpm: 107,
          swingFactor: 0,
          swingBeat: 0.5,
        },
        meter: response.data.score_data.meters?.[0] || {
          beat: 1,
          numBeats: 4,
          beatUnit: 1,
        },
      });
      setJsonData(JSON.stringify(response.data.score_data, null, 2));
      // 获取新创建的 Score
      try {
        const scoresResponse = await api.get(`/api/scores/?track_id=${id}`);
        const userScore = scoresResponse.data[0];
        if (userScore) {
          setScoreId(userScore.id);
        }
      } catch (err) {
        console.error("获取乐谱失败:", err);
        setFormError("无法获取新上传的乐谱信息，请稍后重试");
      }
      setFormError(null);
    } catch (err) {
      console.error("上传歌谱失败:", err);
      setFormError("歌谱上传失败，请检查文件格式或稍后重试");
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

  // 解析歌曲结构
  const getStructure = (scoreData) => {
    const sections = scoreData?.sections || [];
    if (!sections.length) return "未知";

    const getSectionColor = (sectionName) => {
      const lowerName = sectionName.toLowerCase();
      if (lowerName.includes("intro")) return "#4CAF50"; // Green
      if (lowerName.includes("verse")) return "#2196F3"; // Blue
      if (lowerName.includes("chorus")) return "#FF9800"; // Orange
      if (lowerName.includes("bridge")) return "#9C27B0"; // Purple
      if (lowerName.includes("outro")) return "#F44336"; // Red
      if (lowerName.includes("section")) return "#607D8B"; // Grey
      if (lowerName.includes("interlude")) return "#607D8B"; // Grey
      if (lowerName.includes("pre")) return "#607D8B"; // Grey
      return "#607D8B"; // Default Grey
    };

    return (
      <div className="flex flex-wrap gap-2">
        {sections.map((s, index) => (
          <Button
            key={index}
            size="small"
            variant="contained"
            sx={{
              backgroundColor: getSectionColor(s.name),
              color: "#fff",
              "&:hover": {
                backgroundColor: getSectionColor(s.name),
                opacity: 0.9,
              },
              borderRadius: "16px",
              textTransform: "none",
              fontSize: "0.75rem",
              padding: "2px 8px",
            }}
          >
            {s.name}
          </Button>
        ))}
      </div>
    );
  };

  // 获取每个段落的和弦进行
  const getChordProgression = (scoreData, sectionName) => {
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
    const sectionRelative = relativeChordsData.find((rc) =>
      rc.section.toLowerCase().includes(sectionName.toLowerCase())
    );
    const uniqueRelativeChords = sectionRelative ? sectionRelative.chords : [];

    return uniqueChords.length ? (
      <Box>
        {/* 绝对和弦进行 */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: "100px", color: "grey.600" }}
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
        {/* 相对和弦进行 */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="subtitle2"
            sx={{ minWidth: "100px", color: "grey.600" }}
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

  // 处理表单输入变化
  const handleFormChange = (e, field, subField = null) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (field === "key" || field === "tempo" || field === "meter") {
        return { ...prev, [field]: { ...prev[field], [name]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  // 处理 JSON 输入变化
  const handleJsonChange = (e) => {
    setJsonData(e.target.value);
  };

  // 验证 JSON
  const validateJson = (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (err) {
      setFormError("无效的 JSON 格式");
      return false;
    }
  };

  // 保存表单数据
  const handleSave = async () => {
    try {
      let payload;
      if (isEditingJson) {
        // 使用 JSON 输入框的内容
        if (!validateJson(jsonData)) return;
        payload = {
          score_data: JSON.parse(jsonData),
          track_id: id,
        };
      } else {
        // 使用表单字段
        if (!formData.key.tonic || !formData.key.scale) {
          setFormError("调性字段不能为空");
          return;
        }
        if (
          !["major", "minor"].includes(formData.key.scale) ||
          ![
            "C",
            "C#",
            "D",
            "D#",
            "E",
            "F",
            "F#",
            "G",
            "G#",
            "A",
            "A#",
            "B",
          ].includes(formData.key.tonic)
        ) {
          setFormError(
            "调性格式无效：scale 必须是 major 或 minor，tonic 必须是有效音名"
          );
          return;
        }
        if (!formData.version || !/^\d+\.\d+\.\d+$/.test(formData.version)) {
          setFormError("版本号格式无效，必须为 x.y.z 格式");
          return;
        }
        if (
          !Number.isFinite(Number(formData.tempo.bpm)) ||
          Number(formData.tempo.bpm) <= 0
        ) {
          setFormError("BPM 必须为正数");
          return;
        }
        if (
          !Number.isFinite(Number(formData.tempo.swingFactor)) ||
          Number(formData.tempo.swingFactor) < 0
        ) {
          setFormError("Swing Factor 必须为非负数");
          return;
        }
        if (
          !Number.isFinite(Number(formData.tempo.swingBeat)) ||
          Number(formData.tempo.swingBeat) <= 0
        ) {
          setFormError("Swing Beat 必须为正数");
          return;
        }
        if (
          !Number.isInteger(Number(formData.meter.numBeats)) ||
          Number(formData.meter.numBeats) <= 0
        ) {
          setFormError("Number of Beats 必须为正整数");
          return;
        }
        if (
          !Number.isInteger(Number(formData.meter.beatUnit)) ||
          Number(formData.meter.beatUnit) <= 0
        ) {
          setFormError("Beat Unit 必须为正整数");
          return;
        }

        payload = {
          score_data: {
            ...trackData.score_data,
            keys: [{ ...formData.key }],
            version: formData.version,
            tempos: [{ ...formData.tempo }],
            meters: [{ ...formData.meter }],
          },
          track_id: id,
        };
      }

      // 确保 score_data 不为空
      if (!payload.score_data) {
        setFormError("歌谱数据不能为空");
        return;
      }

      if (scoreId) {
        // 更新现有 Score
        await api.put(`/api/scores/${scoreId}/update/`, payload);
      } else {
        // 创建新的 Score
        await api.post("/api/scores/create/", payload);
      }

      // 刷新歌曲详情
      const response = await api.get(`/api/tracks/${id}/`);
      setTrackData(response.data);
      setFormData({
        key: response.data.score_data.keys?.[0] || {
          beat: 1,
          tonic: "C",
          scale: "major",
        },
        version: response.data.score_data.version || "1.0.0",
        tempo: response.data.score_data.tempos?.[0] || {
          beat: 1,
          bpm: 107,
          swingFactor: 0,
          swingBeat: 0.5,
        },
        meter: response.data.score_data.meters?.[0] || {
          beat: 1,
          numBeats: 4,
          beatUnit: 1,
        },
      });
      setJsonData(JSON.stringify(response.data.score_data, null, 2));
      // 获取更新的 Score
      try {
        const scoresResponse = await api.get(`/api/scores/?track_id=${id}`);
        const userScore = scoresResponse.data[0];
        if (userScore) {
          setScoreId(userScore.id);
        }
      } catch (err) {
        console.error("获取乐谱失败:", err);
        setFormError("无法获取乐谱信息，请稍后重试");
      }
      setIsEditing(false);
      setIsEditingJson(false);
      setFormError(null);
    } catch (err) {
      console.error("保存歌谱信息失败:", err);
      setFormError(
        err.response?.data?.detail ||
          err.response?.data?.[0] ||
          "保存失败，请检查输入或稍后重试"
      );
    }
  };

  // 审核乐谱
  const handleReview = async (status) => {
    try {
      if (!scoreId) {
        setFormError("未找到乐谱，请先上传乐谱");
        return;
      }
      const payload = {
        status,
        review_comments: "",
      };
      console.log("Reviewing score:", { scoreId, payload });
      await api.put(`/api/scores/review/${scoreId}/`, payload);
      const response = await api.get(`/api/tracks/${id}/`);
      console.log("Review response:", response.data);
      setTrackData(response.data);
      setFormData({
        key: response.data.score_data?.keys?.[0] || formData.key,
        version: response.data.score_data?.version || formData.version,
        tempo: response.data.score_data?.tempos?.[0] || formData.tempo,
        meter: response.data.score_data?.meters?.[0] || formData.meter,
      });
      setJsonData(JSON.stringify(response.data.score_data, null, 2));
      try {
        const scoresResponse = await api.get(`/api/scores/?track_id=${id}`);
        const userScore = scoresResponse.data[0];
        if (userScore) {
          setScoreId(userScore.id);
          setScoreStatus(userScore.status); // 更新 status
        } else {
          setScoreId(null);
          setScoreStatus(null);
        }
      } catch (err) {
        console.error("获取乐谱失败:", err);
      }
      setFormError(null);
    } catch (err) {
      console.error("审核乐谱失败:", err);
      setFormError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "审核失败，请稍后重试"
      );
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setFormData({
      key: trackData.score_data.keys?.[0] || {
        beat: 1,
        tonic: "C",
        scale: "major",
      },
      version: trackData.score_data.version || "1.0.0",
      tempo: trackData.score_data.tempos?.[0] || {
        beat: 1,
        bpm: 107,
        swingFactor: 0,
        swingBeat: 0.5,
      },
      meter: trackData.score_data.meters?.[0] || {
        beat: 1,
        numBeats: 4,
        beatUnit: 1,
      },
    });
    setJsonData(JSON.stringify(trackData.score_data, null, 2));
    setIsEditing(false);
    setIsEditingJson(false);
    setFormError(null);
  };

  // 删除歌谱
  const handleDelete = async () => {
    try {
      if (!scoreId) {
        setFormError("未找到乐谱，请先上传乐谱");
        return;
      }
      await api.delete(`/api/scores/${scoreId}/`);
      setScoreId(null);
      setTrackData({ ...trackData, has_score: false, score_data: null });
      setFormData({
        key: { beat: 1, tonic: "C", scale: "major" },
        version: "1.0.0",
        tempo: { beat: 1, bpm: 107, swingFactor: 0, swingBeat: 0.5 },
        meter: { beat: 1, numBeats: 4, beatUnit: 1 },
      });
      setJsonData("");
      setFormError(null);
    } catch (err) {
      console.error("删除歌谱失败:", err);
      setFormError(
        err.response?.data?.detail || "删除失败，请检查权限或稍后重试"
      );
    }
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
  const sections = scoreData?.sections || [];

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
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      backgroundColor: track.explicit ? "#F44336" : "#4CAF50",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: track.explicit ? "#F44336" : "#4CAF50",
                        opacity: 0.9,
                      },
                      borderRadius: "16px",
                      textTransform: "none",
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                    }}
                  >
                    {track.explicit ? "是" : "否"}
                  </Button>
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
                        {isDragActive ? "拖拽文件到这里" : "拖拽文件到这里"}
                      </h4>
                      <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-500 dark:text-gray-400">
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
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: "16px",
                  bgcolor: "white",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ mb: 3, fontWeight: "bold", color: "grey.800" }}
                >
                  歌谱信息
                </Typography>
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}
                <Box component="form" noValidate>
                  <Grid container spacing={2}>
                    {/* 音符数量 */}
                    <Grid item size={3}>
                      <Typography sx={{ color: "grey.700" }}>
                        音符数量: {getNoteCount(scoreData)}
                      </Typography>
                    </Grid>

                    {/* 和弦数量 */}
                    <Grid item size={3}>
                      <Typography sx={{ color: "grey.700" }}>
                        和弦数量: {getChordCount(scoreData)}
                      </Typography>
                    </Grid>
                    <Grid item size={6}></Grid>

                    {/* 版本号 */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="版本号 (Version)"
                        name="version"
                        value={formData.version}
                        onChange={(e) => handleFormChange(e)}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item size={9}></Grid>

                    {/* 调性 - 主音 */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="主音 (Tonic)"
                        name="tonic"
                        value={formData.key.tonic}
                        onChange={(e) => handleFormChange(e, "key")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* 调性 - 调式 */}
                    <Grid item size={3}>
                      <FormControl fullWidth disabled={!isEditing}>
                        <InputLabel>调式 (Scale)</InputLabel>
                        <Select
                          name="scale"
                          value={formData.key.scale}
                          onChange={(e) => handleFormChange(e, "key")}
                        >
                          <MenuItem value="major">大调</MenuItem>
                          <MenuItem value="minor">小调</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item size={6} />

                    {/* 节拍 - BPM */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="BPM"
                        name="bpm"
                        type="number"
                        value={formData.tempo.bpm}
                        onChange={(e) => handleFormChange(e, "tempo")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* 节拍 - Swing Factor */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="Swing Factor"
                        name="swingFactor"
                        type="number"
                        value={formData.tempo.swingFactor}
                        onChange={(e) => handleFormChange(e, "tempo")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* 节拍 - Swing Beat */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="Swing Beat"
                        name="swingBeat"
                        type="number"
                        value={formData.tempo.swingBeat}
                        onChange={(e) => handleFormChange(e, "tempo")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* 拍子 - Number of Beats */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="Number of Beats"
                        name="numBeats"
                        type="number"
                        value={formData.meter.numBeats}
                        onChange={(e) => handleFormChange(e, "meter")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* 拍子 - Beat Unit */}
                    <Grid item size={3}>
                      <TextField
                        fullWidth
                        label="Beat Unit"
                        name="beatUnit"
                        type="number"
                        value={formData.meter.beatUnit}
                        onChange={(e) => handleFormChange(e, "meter")}
                        disabled={!isEditing}
                        variant="outlined"
                      />
                    </Grid>

                    {/* JSON 编辑 */}
                    {isEditing && isEditingJson && (
                      <Grid item size={12}>
                        <TextField
                          fullWidth
                          label="歌谱数据 (JSON)"
                          value={jsonData}
                          onChange={handleJsonChange}
                          variant="outlined"
                          multiline
                          rows={10}
                          helperText="请输入有效的 JSON 格式歌谱数据"
                        />
                      </Grid>
                    )}

                    {/* 歌曲结构 */}
                    <Grid item size={12}>
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 1, color: "grey.600" }}
                      >
                        歌曲结构
                      </Typography>
                      {getStructure(scoreData)}
                    </Grid>

                    {/* 每个段落的和弦进行 */}
                    {sections.map((section, index) => (
                      <Grid item size={12} key={index}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 1, color: "grey.600" }}
                        >
                          {section.name} 和弦进行
                        </Typography>
                        {getChordProgression(scoreData, section.name)}
                      </Grid>
                    ))}

                    {/* 相似歌曲 */}
                    <Grid item size={12}>
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 1, color: "grey.600" }}
                      >
                        相似歌曲
                      </Typography>
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
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                    {isEditing ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSave}
                        >
                          保存
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleCancel}
                        >
                          取消
                        </Button>
                        {!isEditingJson && (
                          <Button
                            variant="outlined"
                            onClick={() => setIsEditingJson(true)}
                          >
                            编辑 JSON
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsEditing(true)}
                      >
                        编辑
                      </Button>
                    )}
                    {isAdmin &&
                      scoreId &&
                      scoreStatus === "PENDING" && ( // 添加 status 检查
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleReview("APPROVED")}
                          >
                            通过审核
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleReview("REJECTED")}
                          >
                            拒绝审核
                          </Button>
                        </>
                      )}
                  </Box>
                </Box>
              </Box>
            )}
          </div>
        </div>
      )}
    </>
  );
}
