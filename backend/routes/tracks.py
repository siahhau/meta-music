from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from models.track import Track
from database import db

# 配置日志
logger = logging.getLogger(__name__)

# 创建蓝图
tracks_bp = Blueprint('tracks', __name__)

# 获取所有单曲（tracks），支持分页
@tracks_bp.route('/', methods=['GET'])
def get_tracks():
    try:
        # 获取分页参数，默认为第 1 页，每页 10 条记录
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # 使用 paginate 进行分页查询
        pagination = Track.query.paginate(page=page, per_page=per_page, error_out=False)
        tracks = pagination.items

        # 构造分页响应
        response = {
            'tracks': [track.to_dict() for track in tracks],
            'pagination': {
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': pagination.page,
                'per_page': pagination.per_page,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next,
                'prev_page': pagination.prev_num,
                'next_page': pagination.next_num
            }
        }
        return jsonify(response), 200
    except Exception as e:
        logger.error(f"获取 tracks 失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取单首单曲（通过 id）
@tracks_bp.route('/<int:id>', methods=['GET'])
def get_track(id):
    try:
        track = Track.query.get_or_404(id)
        return jsonify(track.to_dict()), 200
    except Exception as e:
        logger.error(f"获取 track {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 404

# 获取单首单曲（通过 spotify_id）
@tracks_bp.route('/spotify/<string:spotify_id>', methods=['GET'])
def get_track_by_spotify_id(spotify_id):
    try:
        track = Track.query.filter_by(spotify_id=spotify_id).first_or_404()
        return jsonify(track.to_dict()), 200
    except Exception as e:
        logger.error(f"获取 track spotify_id {spotify_id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 404

# 添加新单曲（track）
@tracks_bp.route('/', methods=['POST'])
def create_track():
    data = request.get_json()
    if not data or not all(key in data for key in ['spotify_id', 'name', 'artist_name', 'artist_id']):
        return jsonify({'error': 'spotify_id、name、artist_name 和 artist_id 为必填项'}), 400

    try:
        release_date = None
        if data.get('release_date'):
            release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()

        track = Track(
            spotify_id=data['spotify_id'],
            name=data['name'],
            artist_name=data['artist_name'],
            artist_id=data['artist_id'],
            album_name=data.get('album_name'),
            album_id=data.get('album_id'),
            image_url=data.get('image_url'),
            release_date=release_date,
            duration_ms=data.get('duration_ms'),
            track_number=data.get('track_number'),
            popularity=data.get('popularity'),
            chords=data.get('chords'),
            key=data.get('key'),
            scale=data.get('scale')
        )
        db.session.add(track)
        db.session.commit()
        return jsonify(track.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建 track 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

# 更新单曲（track）
@tracks_bp.route('/<int:id>', methods=['PUT'])
def update_track(id):
    try:
        track = Track.query.get_or_404(id)
        data = request.get_json()
        if not data:
            return jsonify({'error': '未提供数据'}), 400

        track.spotify_id = data.get('spotify_id', track.spotify_id)
        track.name = data.get('name', track.name)
        track.artist_name = data.get('artist_name', track.artist_name)
        track.artist_id = data.get('artist_id', track.artist_id)
        track.album_name = data.get('album_name', track.album_name)
        track.album_id = data.get('album_id', track.album_id)
        track.image_url = data.get('image_url', track.image_url)
        if data.get('release_date'):
            track.release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()
        elif 'release_date' in data:
            track.release_date = None
        track.duration_ms = data.get('duration_ms', track.duration_ms)
        track.track_number = data.get('track_number', track.track_number)
        track.popularity = data.get('popularity', track.popularity)
        track.chords = data.get('chords', track.chords)
        track.key = data.get('key', track.key)
        track.scale = data.get('scale', track.scale)
        db.session.commit()
        return jsonify(track.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"更新 track {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

# 删除单曲（track）
@tracks_bp.route('/<int:id>', methods=['DELETE'])
def delete_track(id):
    try:
        track = Track.query.get_or_404(id)
        db.session.delete(track)
        db.session.commit()
        return jsonify({'message': '单曲删除成功'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"删除 track {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400