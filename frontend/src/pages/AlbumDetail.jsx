import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import api from "../api";

export default function AlbumDetail() {
  const { id } = useParams();
  const [albumData, setAlbumData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await api.get(`/api/albums/${id}/`);
        setAlbumData(response.data);
      } catch (err) {
        console.error("获取专辑详情失败:", err);
        setError("无法加载专辑详情，请稍后重试");
      }
    };
    fetchAlbum();
  }, [id]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!albumData) {
    return <div className="p-4">加载中...</div>;
  }

  const album = albumData.album;

  return (
    <>
      <PageMeta
        title={`${album.name} - 专辑详情`}
        description={`专辑 ${album.name} by ${album.artist_name}`}
      />
      <PageBreadcrumb pageTitle="专辑详情" />
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row mb-5">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={album.image_url || "/images/user/owner.jpg"}
                alt={album.name}
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {album.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {album.artist_name}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  发行时间：{album.release_date || "未知"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  唱片公司：{album.label || "未知"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  类型：{album.album_type || "未知"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <ComponentCard title="歌曲列表">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  歌名
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  歌手名
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  时长
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  是否有谱
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {albumData.tracks.length > 0 ? (
                albumData.tracks.map((track) => (
                  <TableRow key={track.spotify_id}>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Link to={`/detail/track/${track.spotify_id}`}>
                        {track.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {track.artist_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-theme-sm dark:text-gray-400">
                      {track.duration}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={track.has_score ? "success" : "danger"}
                      >
                        {track.has_score ? "是" : "否"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="px-4 py-3 text-gray-500 text-center"
                  >
                    无歌曲
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ComponentCard>
      </div>
    </>
  );
}
