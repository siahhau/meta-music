// frontend/src/pages/Tracks.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/badge/Badge";
import {
  CircularProgress,
  Box,
  TextField,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../api";
import { formatDuration } from "../utils";

// 分页大小
const PAGE_SIZE = 100;

export default function SongList() {
  const [tracks, setTracks] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchInput, setSearchInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // DataGrid uses 0-based indexing
    pageSize: PAGE_SIZE,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取歌曲数据
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(
          `/api/tracks/?page_size=2000&query=${encodeURIComponent(filterText)}`
        );
        setTracks(response.data.results || []);
      } catch (err) {
        console.error("获取歌曲列表失败:", err);
        setError("无法加载歌曲列表，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [paginationModel.page, paginationModel.pageSize, filterText]);


  // 处理搜索按钮点击
  const handleSearch = (e) => {
    e.preventDefault()
    setFilterText(searchInput);
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page
  };

  // 定义 DataGrid 列
  const columns = [
    {
      field: "image_url",
      headerName: "封面",
      width: 80,
      renderCell: (params) => (
        <div className="w-10 h-10 overflow-hidden rounded-full">
          <img
            width={40}
            height={40}
            src={params.value || "/images/tracks/default.jpg"}
            alt={params.row.name}
          />
        </div>
      ),
      sortable: false,
    },
    {
      field: "name",
      headerName: "歌曲名称",
      width: 200,
      renderCell: (params) => (
        <Link
          to={`/detail/track/${params.row.spotify_id}`}
          className="text-blue-500 hover:underline dark:text-blue-400"
        >
          {params.value}
        </Link>
      ),
      sortable: true,
    },
    {
      field: "artist_name",
      headerName: "艺术家",
      width: 150,
      sortable: true,
    },
    {
      field: "album_name",
      headerName: "专辑",
      width: 200,
      renderCell: (params) => (
        <Link
          to={`/detail/album/${params.row.album_id}`}
          className="text-blue-500 hover:underline dark:text-blue-400"
        >
          {params.value}
        </Link>
      ),
      sortable: true,
    },
    {
      field: "duration_ms",
      headerName: "时长",
      width: 100,
      valueFormatter: ( value ) => formatDuration(value),
      sortable: true,
    },
    {
      field: "popularity",
      headerName: "流行度",
      width: 120,
      renderCell: (params) => (
        <Badge
          size="sm"
          color={
            params.value > 80
              ? "success"
              : params.value > 60
              ? "warning"
              : "error"
          }
        >
          {params.value}
        </Badge>
      ),
      sortable: true,
    },
    {
      field: "explicit",
      headerName: "明确内容",
      width: 120,
      renderCell: (params) => (
        <Badge size="sm" color={params.value ? "danger" : "success"}>
          {params.value ? "是" : "否"}
        </Badge>
      ),
      sortable: true,
    },
    {
      field: "has_score",
      headerName: "是否有谱",
      width: 120,
      renderCell: (params) => (
        <Badge size="sm" color={params.value ? "success" : "error"}>
          {params.value ? "是" : "否"}
        </Badge>
      ),
      sortable: true,
    }, // 新增列
  ];

  if (loading && !tracks.length) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
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
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
        歌曲列表
      </h2>
      {/* 过滤输入框和搜索按钮 */}
      <form className="mb-4 flex gap-2" onSubmit={handleSearch}>
        <TextField
          type="text"
          placeholder="搜索歌曲或艺术家..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-transparent py-2 px-4 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          variant="outlined"
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          loading={loading}
          sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, width: 100 }}
        >
          搜索
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div style={{ height: 800, width: "100%" }}>
            <DataGrid
              rows={tracks}
              columns={columns}
              getRowId={(row) => row.spotify_id}
              disableRowSelectionOnClick
              sortingOrder={["asc", "desc"]}
              sortModel={
                sortConfig.key
                  ? [{ field: sortConfig.key, sort: sortConfig.direction }]
                  : []
              }
              onSortModelChange={(model) => {
                if (model.length > 0) {
                  setSortConfig({
                    key: model[0].field,
                    direction: model[0].sort,
                  });
                } else {
                  setSortConfig({ key: null, direction: "asc" });
                }
              }}
              sx={{
                "& .MuiDataGrid-cell": {
                  color: "text.primary",
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "background.paper",
                  color: "text.primary",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}