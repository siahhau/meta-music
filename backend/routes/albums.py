from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from models.album import Album
from models.track import Track
from database import db

# 配置日志
logger = logging.getLogger(__name__)

# 创建蓝图
albums_bp = Blueprint('albums', __name__)

# 获取所有专辑（albums），支持分页
@albums_bp.route('/', methods=['GET'])
def get_albums():
    try:
        # 获取分页参数，默认为第 1 页，每页 10 条记录
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # 使用 paginate 进行分页查询
        pagination = Album.query.paginate(page=page, per_page=per_page, error_out=False)
        albums = pagination.items

        # 构造分页响应
        response = {
            'albums': [album.to_dict() for album in albums],
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
        logger.error(f"获取 albums 失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取单个专辑（通过 id）
@albums_bp.route('/<int:id>', methods=['GET'])
def get_album(id):
    try:
        album = Album.query.get_or_404(id)
        return jsonify(album.to_dict()), 200
    except Exception as e:
        logger.error(f"获取 album {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 404

# 获取单个专辑（通过 spotify_id）
@albums_bp.route('/spotify/<string:spotify_id>', methods=['GET'])
def get_album_by_spotify_id(spotify_id):
    try:
        album = Album.query.filter_by(spotify_id=spotify_id).first_or_404()
        return jsonify(album.to_dict()), 200
    except Exception as e:
        logger.error(f"获取 album spotify_id {spotify_id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 404

# 获取专辑下的歌曲（通过 spotify_id），支持分页
@albums_bp.route('/spotify/<string:spotify_id>/tracks', methods=['GET'])
def get_album_tracks(spotify_id):
    try:
        # 获取分页参数，默认为第 1 页，每页 10 条记录
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # 查询专辑下的歌曲
        pagination = Track.query.filter_by(alnum_id=spotify_id).paginate(page=page, per_page=per_page, error_out=False)
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
        logger.error(f"获取 album {spotify_id} 的 tracks 失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 添加新专辑（album）
@albums_bp.route('/', methods=['POST'])
def create_album():
    data = request.get_json()
    if not data or not all(key in data for key in ['spotify_id', 'name', 'artist_name', 'artist_id']):
        return jsonify({'error': 'spotify_id、name、artist_name 和 artist_id 为必填项'}), 400

    try:
        album = Album(
            spotify_id=data['spotify_id'],
            name=data.get('name', 'Unknown Album'),
            artist_name=data['artist_name'],
            artist_id=data['artist_id'],
            image_url=data.get('image_url'),
            release_date=data.get('release_date'),
            release_date_precision=data.get('release_date_precision'),
            uri=data.get('uri'),
            restrictions=data.get('restrictions'),
            tracks=data.get('tracks'),
            copyrights=data.get('copyrights'),
            genres=data.get('genres', []),
            label=data.get('label'),
            popularity=data.get('popularity'),
            total_tracks=data.get('total_tracks'),
            album_type=data.get('album_type')
        )
        db.session.add(album)
        db.session.commit()
        return jsonify(album.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建 album 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

# 更新专辑（album）
@albums_bp.route('/<int:id>', methods=['PUT'])
def update_album(id):
    try:
        album = Album.query.get_or_404(id)
        data = request.get_json()
        if not data:
            return jsonify({'error': '未提供数据'}), 400

        album.spotify_id = data.get('spotify_id', album.spotify_id)
        album.name = data.get('name', album.name)
        album.artist_name = data.get('artist_name', album.artist_name)
        album.artist_id = data.get('artist_id', album.artist_id)
        album.image_url = data.get('image_url', album.image_url)
        album.release_date = data.get('release_date', album.release_date)
        album.release_date_precision = data.get('release_date_precision', album.release_date_precision)
        album.uri = data.get('uri', album.uri)
        album.restrictions = data.get('restrictions', album.restrictions)
        album.tracks = data.get('tracks', album.tracks)
        album.copyrights = data.get('copyrights', album.copyrights)
        album.genres = data.get('genres', album.genres)
        album.label = data.get('label', album.label)
        album.popularity = data.get('popularity', album.popularity)
        album.total_tracks = data.get('total_tracks', album.total_tracks)
        album.album_type = data.get('album_type', album.album_type)
        db.session.commit()
        return jsonify(album.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"更新 album {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

# 删除专辑（album）
@albums_bp.route('/<int:id>', methods=['DELETE'])
def delete_album(id):
    try:
        album = Album.query.get_or_404(id)
        db.session.delete(album)
        db.session.commit()
        return jsonify({'message': '专辑删除成功'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"删除 album {id} 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400