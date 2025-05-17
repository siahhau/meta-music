from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from database import db
from models.track import Track
from models.album import Album
from sqlalchemy import or_
import requests
import base64
from datetime import datetime
from flask_migrate import Migrate  # 导入 Flask-Migrate

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

# 初始化 Flask 应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "cd-postgres-h62v2r9k.sql.tencentcdb.com")
DB_PORT = os.getenv("DB_PORT", "25175")
DB_USER = os.getenv("DB_USER", "siahhau")
DB_NAME = os.getenv("DB_NAME", "music_lib")
DB_PWD = os.getenv("DB_PWD")
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PWD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 5,
    'max_overflow': 10,
    'pool_timeout': 30,
    'pool_recycle': 100,  # 缩短回收时间
    'pool_pre_ping': True,
    'connect_args': {
        'connect_timeout': 10,
        'keepalives': 1,
        'keepalives_idle': 30,
        'keepalives_interval': 10,
        'keepalives_count': 5
    }
}

# Spotify API 配置
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# 验证环境变量
required_env_vars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'DB_PWD', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET']
for var in required_env_vars:
    if not os.getenv(var):
        logger.error(f"环境变量 {var} 未设置")
        raise ValueError(f"环境变量 {var} 未设置")

# 调试环境变量
logger.info(f"SPOTIFY_CLIENT_ID: {SPOTIFY_CLIENT_ID}")
logger.info(f"SPOTIFY_CLIENT_SECRET: {SPOTIFY_CLIENT_SECRET}")
logger.info(f"数据库配置: {app.config['SQLALCHEMY_DATABASE_URI']}")

# 初始化 SQLAlchemy 和 Migrate
db.init_app(app)
migrate = Migrate(app, db)  # 初始化 Flask-Migrate

def get_spotify_token():
    """获取 Spotify API 的访问令牌"""
    auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    auth_base64 = base64.b64encode(auth_string.encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    response = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
    
    if response.status_code != 200:
        logger.error(f"获取 Spotify 令牌失败: {response.text}")
        raise Exception(f"获取 Spotify 令牌失败: {response.status_code}")
    
    return response.json()['access_token']

def register_blueprints():
    from routes.tracks import tracks_bp
    from routes.albums import albums_bp
    app.register_blueprint(tracks_bp, url_prefix='/tracks')
    app.register_blueprint(albums_bp, url_prefix='/albums')

# 搜索接口
@app.route('/search', methods=['GET'])
def search():
    """搜索单曲、专辑和艺术家，从 Spotify API 获取并存入数据库"""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'results': []}), 200

    results = []
    try:
        # 获取 Spotify 访问令牌
        token = get_spotify_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "q": query,
            "type": "track,album,artist",
            "limit": 10
        }
        response = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
        
        if response.status_code != 200:
            logger.error(f"Spotify API 请求失败: {response.text}")
            return jsonify({'error': f"Spotify API 请求失败: {response.status_code}"}), 500
        
        spotify_results = response.json()

        # 处理单曲
        for track in spotify_results['tracks']['items']:
            existing_track = Track.query.filter_by(spotify_id=track['id']).first()
            if not existing_track:
                release_date = None
                if track['album'].get('release_date'):
                    try:
                        release_date = datetime.strptime(track['album']['release_date'], '%Y-%m-%d').date()
                    except ValueError:
                        logger.warning(f"无效的发行日期格式 for track {track['id']}: {track['album']['release_date']}")

                track_data = Track(
                    spotify_id=track['id'],
                    name=track['name'],
                    artist_name=', '.join(artist['name'] for artist in track['artists']),
                    artist_id=track['artists'][0]['id'],
                    album_name=track['album']['name'],
                    album_id=track['album']['id'],
                    image_url=track['album']['images'][0]['url'] if track['album']['images'] else None,
                    release_date=release_date,
                    duration_ms=track['duration_ms'],
                    track_number=track['track_number'],
                    popularity=track.get('popularity')
                )
                db.session.add(track_data)
                try:
                    db.session.commit()
                    logger.info(f"添加单曲 {track['name']} 到数据库")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"添加单曲 {track['name']} 失败: {str(e)}")

            results.append({
                'id': track['id'],
                'type': 'track',
                'title': track['name'],
                'artist_name': ', '.join(artist['name'] for artist in track['artists']),
                'path': f'/dashboard/track/{track["id"]}'
            })

        # 处理专辑
        for album in spotify_results['albums']['items']:
            existing_album = Album.query.filter_by(spotify_id=album['id']).first()
            if not existing_album:
                album_data = Album(
                    spotify_id=album['id'],
                    name=album['name'],
                    artist_name=', '.join(artist['name'] for artist in album['artists']),
                    artist_id=album['artists'][0]['id'],
                    image_url=album['images'][0]['url'] if album['images'] else None,
                    release_date=album['release_date'],
                    release_date_precision=album['release_date_precision'],
                    uri=album['uri'],
                    genres=album.get('genres', []),
                    label=album.get('label'),
                    popularity=album.get('popularity'),
                    total_tracks=album['total_tracks'],
                    album_type=album['album_type']
                )
                db.session.add(album_data)
                try:
                    db.session.commit()
                    logger.info(f"添加专辑 {album['name']} 到数据库")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"添加专辑 {album['name']} 失败: {str(e)}")

            results.append({
                'id': album['id'],
                'type': 'album',
                'title': album['name'],
                'artist_name': ', '.join(artist['name'] for artist in album['artists']),
                'path': f'/dashboard/album/{album["id"]}'
            })

        # 处理艺术家（仅返回，不存入数据库）
        artist_ids = set()
        for artist in spotify_results['artists']['items']:
            if artist['id'] not in artist_ids:
                results.append({
                    'id': artist['id'],
                    'type': 'artist',
                    'title': artist['name'],
                    'path': f'/dashboard/artist/{artist["id"]}'
                })
                artist_ids.add(artist['id'])

        return jsonify({'results': results}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"搜索失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 注册蓝图和创建数据库表
with app.app_context():
    register_blueprints()
    try:
        db.create_all()
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"创建数据库表失败: {str(e)}")
        raise e

if __name__ == '__main__':
    logger.info("启动 Flask 应用")
    app.run(debug=True, host='0.0.0.0', port=8000)