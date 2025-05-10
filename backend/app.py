from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from database import db
from models.track import Track
from models.album import Album
from sqlalchemy import or_

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
    'pool_size': 10,          # 增加到 10 个连接
    'max_overflow': 20,       # 允许 20 个溢出连接
    'pool_timeout': 60,       # 等待 60 秒
    'pool_recycle': 1800,     # 每 30 分钟回收连接
    'pool_pre_ping': True     # 每次借用连接时检查其有效性
}

# 验证环境变量
required_env_vars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'DB_PWD']
for var in required_env_vars:
    if not os.getenv(var):
        logger.error(f"环境变量 {var} 未设置")
        raise ValueError(f"环境变量 {var} 未设置")

# 打印数据库配置以调试
logger.info(f"数据库配置: {app.config['SQLALCHEMY_DATABASE_URI']}")

# 初始化 SQLAlchemy
db.init_app(app)

def register_blueprints():
    from routes.tracks import tracks_bp
    from routes.albums import albums_bp
    app.register_blueprint(tracks_bp, url_prefix='/tracks')
    app.register_blueprint(albums_bp, url_prefix='/albums')

# 搜索接口
@app.route('/search', methods=['GET'])
def search():
    """搜索单曲、专辑和艺术家"""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'results': []}), 200

    results = []
    try:
        # 搜索单曲
        tracks = Track.query.filter(
            or_(
                Track.name.ilike(f'%{query}%'),
                Track.artist_name.ilike(f'%{query}%')
            )
        ).limit(10).all()
        for track in tracks:
            results.append({
                'id': track.spotify_id,
                'type': 'track',
                'title': track.name,
                'artist_name': track.artist_name,  # 添加 artist_name 用于前端显示
                'path': f'/dashboard/track/{track.spotify_id}'
            })

        # 搜索专辑
        albums = Album.query.filter(
            or_(
                Album.name.ilike(f'%{query}%'),
                Album.artist_name.ilike(f'%{query}%')
            )
        ).limit(10).all()
        for album in albums:
            results.append({
                'id': album.spotify_id,
                'type': 'album',
                'title': album.name,
                'path': f'/dashboard/album/{album.spotify_id}'
            })

        # 搜索艺术家（从 tracks 和 albums 中提取唯一艺术家）
        artist_ids = set()
        artists = []
        for track in Track.query.filter(Track.artist_name.ilike(f'%{query}%')).limit(10).all():
            if track.artist_id not in artist_ids:
                artists.append({
                    'id': track.artist_id,
                    'type': 'artist',
                    'title': track.artist_name,
                    'path': f'/dashboard/artist/{track.artist_id}'
                })
                artist_ids.add(track.artist_id)
        for album in Album.query.filter(Album.artist_name.ilike(f'%{query}%')).limit(10).all():
            if album.artist_id not in artist_ids:
                artists.append({
                    'id': album.artist_id,
                    'type': 'artist',
                    'title': album.artist_name,
                    'path': f'/dashboard/artist/{album.artist_id}'
                })
                artist_ids.add(album.artist_id)
        results.extend(artists[:10])  # 限制艺术家结果数量

        return jsonify({'results': results}), 200

    except Exception as e:
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