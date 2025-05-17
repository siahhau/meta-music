# backend/routes/albums.py
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from sqlalchemy.sql import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from models.album import Album
from models.track import Track
from models.comment import Comment
from models.rating import Rating
from database import db
import requests
import os

# 配置日志
logger = logging.getLogger(__name__)

# 创建蓝图
albums_bp = Blueprint('albums', __name__)

# 获取 Spotify 访问令牌
def get_spotify_token():
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise ValueError("缺少 Spotify 客户端凭据")
    auth_url = 'https://accounts.spotify.com/api/token'
    auth_response = requests.post(auth_url, {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret
    })
    auth_response.raise_for_status()
    return auth_response.json()['access_token']

# 获取所有专辑（albums），支持分页
@albums_bp.route('/', methods=['GET'])
def get_albums():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        pagination = Album.query.paginate(page=page, per_page=per_page, error_out=False)
        albums = pagination.items
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
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        pagination = Track.query.filter_by(album_id=spotify_id).paginate(page=page, per_page=per_page, error_out=False)
        tracks = pagination.items
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

# 获取专辑的评论（通过 spotify_id）
@albums_bp.route('/spotify/<string:spotify_id>/comments', methods=['GET'])
def get_album_comments(spotify_id):
    try:
        comments = Comment.query.filter_by(album_id=spotify_id).all()
        return jsonify({
            'count': len(comments),
            'items': [comment.to_dict() for comment in comments]
        }), 200
    except Exception as e:
        logger.error(f"获取 album {spotify_id} 的 comments 失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 发布新评论
@albums_bp.route('/spotify/<string:spotify_id>/comments', methods=['POST'])
def create_album_comment(spotify_id):
    data = request.get_json()
    if not data or not all(key in data for key in ['content', 'user']):
        return jsonify({'error': 'content 和 user 为必填项'}), 400

    try:
        comment = Comment(
            album_id=spotify_id,
            content=data['content'],
            user=data['user'],
            score=data.get('score', 0)
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify(comment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建 comment 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

# 获取专辑的评测（通过 spotify_id）
@albums_bp.route('/spotify/<string:spotify_id>/ratings', methods=['GET'])
def get_album_ratings(spotify_id):
    try:
        ratings = Rating.query.filter_by(album_id=spotify_id).all()
        return jsonify({
            'count': len(ratings),
            'items': [rating.to_dict() for rating in ratings]
        }), 200
    except Exception as e:
        logger.error(f"获取 album {spotify_id} 的 ratings 失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取专辑的平均评分（通过 spotify_id）
@albums_bp.route('/spotify/<string:spotify_id>/average-rating', methods=['GET'])
def get_album_average_rating(spotify_id):
    try:
        result = db.session.query(
            func.avg(Rating.score).label('average_rating'),
            func.count(Rating.id).label('rating_count')
        ).filter_by(album_id=spotify_id).first()

        logger.debug(f"Average rating query result for {spotify_id}: {result}") # 调试日志
        average_rating = float(result.average_rating) if result.average_rating else 0.0
        rating_count = result.rating_count or 0

        return jsonify({
            'average_rating': round(average_rating, 1),
            'rating_count': rating_count
        }), 200
    except Exception as e:
        logger.error(f"获取 album {spotify_id} 的平均评分失败: {str(e)}")
        return jsonify({
            'average_rating': 0,
            'rating_count': 0
        }), 200

# 发布评分和评测
@albums_bp.route('/spotify/<string:spotify_id>/ratings', methods=['POST'])
def create_album_rating(spotify_id):
    data = request.get_json()
    if not data or not all(key in data for key in ['score', 'user']):
        return jsonify({'error': 'score 和 user 为必填项'}), 400

    try:
        rating = Rating(
            album_id=spotify_id,
            score=data['score'],
            review=data.get('review', ''),
            user=data['user']
        )
        db.session.add(rating)
        db.session.commit()
        return jsonify(rating.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建 rating 失败: {str(e)}")
        return jsonify({'error': str(e)}), 400

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
    
@albums_bp.route('/spotify/<string:spotify_id>/sync', methods=['POST'])
def sync_album(spotify_id):
    """同步 Spotify 专辑数据"""
    # 使用独立会话，禁用 autoflush
    session = Session(bind=db.engine, autoflush=False)
    try:
        token = get_spotify_token()
        headers = {'Authorization': f'Bearer {token}'}
        url = f'https://api.spotify.com/v1/albums/{spotify_id}'
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        spotify_data = response.json()

        # 处理专辑数据
        album = session.query(Album).filter_by(spotify_id=spotify_id).first()
        if not album:
            album = Album(
                spotify_id=spotify_id,
                name=spotify_data.get('name', 'Unknown Album'),
                artist_name=', '.join(artist['name'] for artist in spotify_data.get('artists', []))[:255],
                artist_id=', '.join(artist['id'] for artist in spotify_data.get('artists', []))[:255],
                album_type=spotify_data.get('album_type'),
                release_date=spotify_data.get('release_date'),
                release_date_precision=spotify_data.get('release_date_precision'),
                total_tracks=spotify_data.get('total_tracks', 0),
                image_url=spotify_data['images'][0]['url'] if spotify_data.get('images') else None,
                label=spotify_data.get('label'),
                genres=spotify_data.get('genres', []),
                popularity=spotify_data.get('popularity'),
                uri=spotify_data.get('uri'),
                tracks={
                    'tracks': {
                        'items': [
                            {
                                'id': track['id'],
                                'name': track['name'],
                                'artists': track['artists'],
                                'duration_ms': track['duration_ms'],
                                'track_number': track['track_number'],
                                'popularity': track.get('popularity')
                            } for track in spotify_data.get('tracks', {}).get('items', [])
                        ]
                    }
                }
            )
            session.add(album)
        else:
            album.name = spotify_data.get('name', album.name)
            album.artist_name = ', '.join(artist['name'] for artist in spotify_data.get('artists', []))[:255]
            album.artist_id = ', '.join(artist['id'] for artist in spotify_data.get('artists', []))[:255]
            album.album_type = spotify_data.get('album_type', album.album_type)
            album.release_date = spotify_data.get('release_date', album.release_date)
            album.release_date_precision = spotify_data.get('release_date_precision', album.release_date_precision)
            album.total_tracks = spotify_data.get('total_tracks', album.total_tracks)
            album.image_url = spotify_data['images'][0]['url'] if spotify_data.get('images') else album.image_url
            album.label = spotify_data.get('label', album.label)
            album.genres = spotify_data.get('genres', album.genres)
            album.popularity = spotify_data.get('popularity', album.popularity)
            album.uri = spotify_data.get('uri', album.uri)
            album.tracks = {
                'tracks': {
                    'items': [
                        {
                            'id': track['id'],
                            'name': track['name'],
                            'artists': track['artists'],
                            'duration_ms': track['duration_ms'],
                            'track_number': track['track_number'],
                            'popularity': track.get('popularity')
                        } for track in spotify_data.get('tracks', {}).get('items', [])
                    ]
                }
            }

        # 提交 album 事务
        session.flush()
        session.commit()

        # 处理歌曲数据，分批提交
        for track_data in spotify_data.get('tracks', {}).get('items', []):
            try:
                # 新事务处理每首歌曲
                with session.no_autoflush:
                    track = session.query(Track).filter_by(spotify_id=track_data['id']).first()
                if not track:
                    track = Track(
                        spotify_id=track_data['id'],
                        name=track_data.get('name', 'Unknown Song'),
                        artist_name=', '.join(artist['name'] for artist in track_data.get('artists', []))[:255],
                        artist_id=', '.join(artist['id'] for artist in track_data.get('artists', []))[:255],
                        album_name=spotify_data.get('name'),
                        album_id=spotify_id,
                        duration_ms=track_data.get('duration_ms'),
                        track_number=track_data.get('track_number'),
                        popularity=track_data.get('popularity'),
                        created_at=datetime.utcnow(),
                        explicit=track_data.get('explicit', False)
                    )
                    session.add(track)
                else:
                    track.name = track_data.get('name', track.name)
                    track.artist_name = ', '.join(artist['name'] for artist in track_data.get('artists', []))[:255]
                    track.artist_id = ', '.join(artist['id'] for artist in track_data.get('artists', []))[:255]
                    track.album_name = spotify_data.get('name', track.album_name)
                    track.album_id = spotify_id
                    track.duration_ms = track_data.get('duration_ms', track.duration_ms)
                    track.track_number = track_data.get('track_number', track.track_number)
                    track.popularity = track_data.get('popularity', track.popularity)
                    track.explicit = track_data.get('explicit', track.explicit)

                # 提交每首歌曲事务
                session.flush()
                session.commit()
            except Exception as track_error:
                logger.error(f"处理歌曲 {track_data['id']} 失败: {str(track_error)}")
                session.rollback()
                continue  # 继续处理下一首歌曲

        logger.info(f"成功同步专辑 {spotify_id}")
        return jsonify(album.to_dict()), 200

    except requests.exceptions.RequestException as e:
        session.rollback()
        logger.error(f"Spotify API 请求失败 for {spotify_id}: {str(e)}")
        return jsonify({'error': '无法获取 Spotify 数据'}), 500
    except SQLAlchemyError as db_error:
        session.rollback()
        logger.error(f"数据库提交失败 for {spotify_id}: {str(db_error)}")
        return jsonify({'error': '数据库错误，请稍后重试'}), 500
    except Exception as e:
        session.rollback()
        logger.error(f"同步专辑失败 for {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()