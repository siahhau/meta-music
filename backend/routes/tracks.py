# backend/routes/tracks.py
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import json
from models.track import Track
from models.score import Score
from database import db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
logger = logging.getLogger(__name__)
tracks_bp = Blueprint('tracks', __name__)

@tracks_bp.route('/spotify/<string:spotify_id>', methods=['GET'])
def get_track(spotify_id):
    """获取歌曲信息"""
    session = db.session()
    try:
        track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        if not track:
            logger.error(f"未找到歌曲: spotify_id={spotify_id}")
            return jsonify({'error': '歌曲不存在'}), 404
        return jsonify(track.to_dict()), 200
    except Exception as e:
        logger.error(f"获取歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/scores', methods=['GET'])
def get_scores(spotify_id):
    """获取歌曲的最新乐谱"""
    session = db.session()
    try:
        latest_score = session.query(Score).filter_by(track_id=spotify_id).order_by(Score.created_at.desc()).first()
        if not latest_score:
            logger.info(f"未找到乐谱 for track {spotify_id}")
            return jsonify({'score_data': {}}), 200
        return jsonify(latest_score.to_dict()), 200
    except Exception as e:
        logger.error(f"获取乐谱失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/upload-chords', methods=['POST'])
def upload_chords(spotify_id):
    """上传乐谱 JSON 文件，更新 tracks 表并保存到 scores 表"""
    session = Session(bind=db.engine, autoflush=False)  # 使用独立会话，禁用 autoflush
    try:
        if 'file' not in request.files:
            logger.error("未提供文件")
            return jsonify({'error': '未提供文件'}), 400
        
        file = request.files['file']
        if not file.filename.endswith('.json'):
            logger.error("文件必须是 JSON 格式")
            return jsonify({'error': '文件必须是 JSON 格式'}), 400

        # 读取和解析 JSON 文件
        try:
            score_data = json.load(file)
            logger.info(f"原始 JSON 数据: {score_data}")
        except json.JSONDecodeError as e:
            logger.error(f"无效的 JSON 文件: {str(e)}")
            return jsonify({'error': '无效的 JSON 文件'}), 400

        # 验证歌曲存在
        track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        if not track:
            logger.error(f"未找到歌曲: spotify_id={spotify_id}")
            return jsonify({'error': '歌曲不存在'}), 404

        # 提取调性
        keys = score_data.get('keys', [])
        if keys:
            key_info = keys[0]
            track.key = key_info.get('tonic', track.key)
            track.scale = key_info.get('scale', track.scale)
            logger.info(f"更新调性: key={track.key}, scale={track.scale}")
        else:
            logger.warning(f"未找到调性信息 for track {spotify_id}")

        # 提取和弦进行
        chords = score_data.get('chords', [])
        chord_list = []
        root_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        for chord in chords:
            root = chord.get('root')
            chord_type = chord.get('type')
            suspensions = chord.get('suspensions', [])
            
            if not root or not isinstance(root, int) or not (1 <= root <= 12):
                logger.warning(f"无效和弦: {chord}")
                continue
            root_name = root_names[root - 1]
            chord_suffix = '' if chord_type == 5 else 'm' if chord_type == 3 else ''
            if suspensions and isinstance(suspensions, list) and suspensions:
                chord_suffix += f"sus{suspensions[0]}"
            
            chord_name = f"{root_name}{chord_suffix}"
            if chord_name not in chord_list:
                chord_list.append(chord_name)

        track.chords = json.dumps(chord_list) if chord_list else track.chords
        logger.info(f"更新和弦: {track.chords}")

        # 提取歌曲结构（仅 name）
        sections = score_data.get('sections', [])
        section_names = [
            section['name']
            for section in sections
            if isinstance(section, dict) and 'name' in section and section['name']
        ]
        track.sections = section_names if section_names else []
        logger.info(f"更新歌曲结构: {track.sections}")

        # 检查 scores 表是否已有记录
        with session.no_autoflush:  # 禁用 autoflush
            score = session.query(Score).filter_by(track_id=spotify_id).order_by(Score.created_at.desc()).first()
        
        if score:
            # 更新现有记录
            score.score_data = score_data
            score.created_at = datetime.utcnow()
            logger.info(f"更新乐谱 for track {spotify_id}")
        else:
            # 新增记录
            score = Score(
                track_id=spotify_id,
                score_data=score_data,
                created_at=datetime.utcnow()
            )
            session.add(score)
            logger.info(f"新增乐谱 for track {spotify_id}")

        # 提交事务
        session.flush()  # 手动刷新
        session.commit()
        logger.info(f"成功保存乐谱 for track {spotify_id}")

        return jsonify({
            'message': '乐谱上传成功',
            'track': track.to_dict(),
            'score_data': score_data
        }), 200

    except SQLAlchemyError as db_error:
        session.rollback()
        logger.error(f"数据库提交失败 for track {spotify_id}: {str(db_error)}")
        return jsonify({'error': '数据库错误，请稍后重试'}), 500
    except Exception as e:
        session.rollback()
        logger.error(f"上传乐谱失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()