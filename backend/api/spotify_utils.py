import logging
import requests
import base64
from django.conf import settings
from urllib.parse import urlencode
from threading import Lock
import time

logger = logging.getLogger(__name__)

class SpotifyAuth:
    _token = None
    _expiry = 0
    _lock = Lock()

    @classmethod
    def get_spotify_access_token(cls):
        with cls._lock:
            current_time = time.time()
            if cls._token and cls._expiry > current_time:
                logger.debug("使用缓存的 Spotify 令牌")
                return cls._token

            client_id = getattr(settings, 'SPOTIFY_CLIENT_ID', None)
            client_secret = getattr(settings, 'SPOTIFY_CLIENT_SECRET', None)
            if not client_id or not client_secret:
                logger.error("Spotify Client ID 或 Secret 未在 settings 中配置！")
                raise ValueError("Spotify Client ID 或 Secret 未配置")

            try:
                auth_string = f"{client_id}:{client_secret}"
                auth_bytes = auth_string.encode('ascii')
                auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
                headers = {
                    'Authorization': f'Basic {auth_b64}',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
                data = {'grant_type': 'client_credentials'}
                logger.debug("请求 Spotify 令牌")
                response = requests.post('https://accounts.spotify.com/api/token', headers=headers, data=data)
                response.raise_for_status()
                token_data = response.json()
                access_token = token_data.get('access_token')
                if not access_token:
                    logger.error("无法获取 Spotify 访问令牌: 响应中无 access_token")
                    return None
                cls._token = access_token
                cls._expiry = current_time + token_data.get('expires_in', 3600) - 60
                logger.info("Spotify access token obtained successfully.")
                return access_token
            except requests.exceptions.RequestException as e:
                logger.error(f"无法获取 Spotify 访问令牌: {e}")
                return None
            except Exception as e:
                logger.exception(f"初始化 Spotify 客户端失败: {e}")
                return None

def search_spotify(query, limit=50, search_types=['track', 'artist', 'album'], offset=0):
    """Search Spotify API for multiple types."""
    access_token = SpotifyAuth.get_spotify_access_token()
    if not access_token:
        logger.warning("无法获取 Spotify 令牌，返回空结果")
        return []

    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        params = {
            'q': query,
            'type': ','.join(search_types),
            'limit': min(limit, 50),
            'offset': offset,
            'market': 'TW'
        }
        request_url = f"https://api.spotify.com/v1/search?{urlencode(params)}"
        logger.debug(f"Spotify API 请求 URL: {request_url}")
        response = requests.get('https://api.spotify.com/v1/search', headers=headers, params=urlencode(params))
        logger.debug(f"Spotify API 响应状态码: {response.status_code}, 响应内容: {response.text}")
        response.raise_for_status()
        results = response.json()
        logger.debug(f"Spotify API 原始响应: {results}")

        formatted_results = []
        for search_type in search_types:
            key = f"{search_type}s"
            items = results.get(key, {}).get('items', [])
            logger.debug(f"{search_type} 找到 {len(items)} 条结果")
            for item in items:
                image_url = ''
                images = item.get('images', []) if search_type != 'track' else item.get('album', {}).get('images', [])
                if images:
                    image_url = images[0].get('url', '')

                if search_type == 'track':
                    formatted_results.append({
                        'spotify_id': item.get('id'),
                        'name': item.get('name'),
                        'type': 'track',
                        'artist_name': ', '.join(artist.get('name', '') for artist in item.get('artists', [])),
                        'artist_id': item.get('artists', [{}])[0].get('id', ''),
                        'album_name': item.get('album', {}).get('name', ''),
                        'album_id': item.get('album', {}).get('id', ''),
                        'image_url': image_url,
                        'release_date': item.get('album', {}).get('release_date', ''),
                        'duration_ms': item.get('duration_ms'),
                        'track_number': item.get('track_number'),
                        'explicit': item.get('explicit', False),
                        'popularity': item.get('popularity', 0)
                    })
                elif search_type == 'artist':
                    formatted_results.append({
                        'spotify_id': item.get('id'),
                        'name': item.get('name'),
                        'type': 'artist',
                        'image_url': image_url,
                        'genres': item.get('genres', []),
                        'popularity': item.get('popularity')
                    })
                elif search_type == 'album':
                    formatted_results.append({
                        'spotify_id': item.get('id'),
                        'name': item.get('name'),
                        'type': 'album',
                        'artist_name': ', '.join(artist.get('name', '') for artist in item.get('artists', [])),
                        'artist_id': item.get('artists', [{}])[0].get('id', ''),
                        'image_url': image_url,
                        'release_date': item.get('release_date', ''),
                        'total_tracks': item.get('total_tracks'),
                        'label': item.get('label', ''),
                        'album_type': item.get('album_type', '')
                    })

        logger.info(f"Spotify 搜索 '{query}' 成功，返回 {len(formatted_results)} 条结果")
        return formatted_results
    except requests.exceptions.HTTPError as e:
        logger.error(f"Spotify API 错误: Status Code={e.response.status_code}, Reason={e}, Response={e.response.text}")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"处理 Spotify 搜索时发生请求错误: {e}")
        return []
    except Exception as e:
        logger.exception(f"处理 Spotify 搜索时发生未知错误: {e}")
        return []

def get_album_details(album_id):
    """Get album details from Spotify API."""
    access_token = SpotifyAuth.get_spotify_access_token()
    if not access_token:
        logger.warning("无法获取 Spotify 令牌，返回空结果")
        return None

    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        request_url = f"https://api.spotify.com/v1/albums/{album_id}"
        logger.debug(f"Spotify API 请求 URL: {request_url}")
        response = requests.get(request_url, headers=headers, params={'market': 'TW'})
        logger.debug(f"Spotify API 响应状态码: {response.status_code}, 响应内容: {response.text}")
        response.raise_for_status()
        data = response.json()

        image_url = data.get('images', [{}])[0].get('url', '')
        artist_name = ', '.join(artist.get('name', '') for artist in data.get('artists', []))
        artist_id = data.get('artists', [{}])[0].get('id', '')
        
        album_data = {
            'spotify_id': data.get('id'),
            'name': data.get('name'),
            'artist_name': artist_name,
            'artist_id': artist_id,
            'image_url': image_url,
            'release_date': data.get('release_date', ''),
            'total_tracks': data.get('total_tracks', 0),
            'label': data.get('label', ''),
            'album_type': data.get('album_type', ''),
            'tracks': [
                {
                    'spotify_id': track.get('id'),
                    'name': track.get('name'),
                    'artist_name': ', '.join(artist.get('name', '') for artist in track.get('artists', [])),
                    'artist_id': track.get('artists', [{}])[0].get('id', ''),
                    'album_id': data.get('id'),
                    'image_url': image_url,
                    'release_date': data.get('release_date', ''),
                    'duration_ms': track.get('duration_ms', 0),
                    'track_number': track.get('track_number', 0),
                    'explicit': track.get('explicit', False),
                    'popularity': track.get('popularity', 0)
                }
                for track in data.get('tracks', {}).get('items', [])
            ]
        }

        logger.info(f"获取专辑详情成功 (album_id: {album_id})")
        return album_data
    except requests.exceptions.HTTPError as e:
        logger.error(f"Spotify API 错误: Status Code={e.response.status_code}, Reason={e}, Response={e.response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"处理 Spotify 专辑详情时发生请求错误: {e}")
        return None
    except Exception as e:
        logger.exception(f"处理 Spotify 专辑详情时发生未知错误: {e}")
        return None

def get_track_details(track_id):
    """Get track details from Spotify API."""
    access_token = SpotifyAuth.get_spotify_access_token()
    if not access_token:
        logger.warning("无法获取 Spotify 令牌，返回空结果")
        return None

    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        request_url = f"https://api.spotify.com/v1/tracks/{track_id}"
        logger.debug(f"Spotify API 请求 URL: {request_url}")
        response = requests.get(request_url, headers=headers, params={'market': 'TW'})
        logger.debug(f"Spotify API 响应状态码: {response.status_code}, 响应内容: {response.text}")
        response.raise_for_status()
        data = response.json()

        album = data.get('album', {})
        image_url = album.get('images', [{}])[0].get('url', '')
        artist_name = ', '.join(artist.get('name', '') for artist in data.get('artists', []))
        artist_id = data.get('artists', [{}])[0].get('id', '')

        track_data = {
            'spotify_id': data.get('id'),
            'name': data.get('name'),
            'artist_name': artist_name,
            'artist_id': artist_id,
            'album_name': album.get('name', ''),
            'album_id': album.get('id', ''),
            'image_url': image_url,
            'release_date': album.get('release_date', ''),
            'duration_ms': data.get('duration_ms', 0),
            'track_number': data.get('track_number', 0),
            'explicit': data.get('explicit', False),
            'popularity': data.get('popularity', 0),
            'album': {
                'spotify_id': album.get('id'),
                'name': album.get('name'),
                'artist_name': ', '.join(artist.get('name', '') for artist in album.get('artists', [])),
                'artist_id': album.get('artists', [{}])[0].get('id', ''),
                'image_url': image_url,
                'release_date': album.get('release_date', ''),
                'total_tracks': album.get('total_tracks', 0),
                'album_type': album.get('album_type', '')
            }
        }

        logger.info(f"获取单曲详情成功 (track_id: {track_id})")
        return track_data
    except requests.exceptions.HTTPError as e:
        logger.error(f"Spotify API 错误: Status Code={e.response.status_code}, Reason={e}, Response={e.response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"处理 Spotify 单曲详情时发生请求错误: {e}")
        return None
    except Exception as e:
        logger.exception(f"处理 Spotify 单曲详情时发生未知错误: {e}")
        return None