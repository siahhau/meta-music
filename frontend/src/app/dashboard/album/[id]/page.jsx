import axios from 'axios';
import { CONFIG } from 'src/global-config';
import { AlbumView } from 'src/sections/album/view';

// ----------------------------------------------------------------------

export const metadata = { title: `专辑加载中... - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const id = params.id; // 动态路由参数，例如 '5iT3F2EhjVQVrO4PKhsP8c'
  console.log('请求的 id:', id); // 调试：打印实际 id

  try {
    // 获取当前专辑
    const albumResponse = await axios.get(`http://localhost:8000/albums/spotify/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (albumResponse.status !== 200) {
      throw new Error(`HTTP error! Status: ${albumResponse.status}`);
    }

    const album = albumResponse.data;
    console.log('专辑信息:', album);

    // 获取歌曲详情
    const trackIds = album.tracks || []; // 假设 tracks 是 ["id1", "id2", ...]
    const tracks = [];
    for (const trackId of trackIds) {
      try {
        const trackResponse = await axios.get(`http://localhost:8000/tracks/spotify/${trackId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (trackResponse.status === 200) {
          tracks.push(trackResponse.data);
        }
      } catch (error) {
        console.error(`获取歌曲 ${trackId} 失败:`, error);
      }
    }
    console.log('歌曲列表:', tracks);

    // 获取专辑列表
    const albumsResponse = await axios.get(`http://localhost:8000/albums/?page=1&per_page=10`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (albumsResponse.status !== 200) {
      throw new Error(`HTTP error! Status: ${albumsResponse.status}`);
    }

    const albums = albumsResponse.data.albums;
    console.log('专辑列表:', albums);

    return <AlbumView album={album} albums={albums} tracks={tracks} />;
  } catch (error) {
    console.error('获取数据失败:', error);
    return (
      <div>
        <h1>错误</h1>
        <p>无法加载数据：{error.message}</p>
        {error.response && (
          <p>后端错误详情：{JSON.stringify(error.response.data)}</p>
        )}
      </div>
    );
  }
}
