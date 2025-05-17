# backend/routes/midis.py
from flask import Blueprint, request, jsonify, send_file, current_app
from datetime import datetime
import logging
import os
import uuid
from werkzeug.utils import secure_filename
from models.midi import Midi
from models.track import Track
from database import db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

# 配置日志
logger = logging.getLogger(__name__)

# 创建蓝图
midis_bp = Blueprint('midis', __name__)

# 配置上传文件夹
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'midis')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # 确保上传文件夹存在

# 允许的MIDI文件扩展名
ALLOWED_EXTENSIONS = {'mid', 'midi'}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@midis_bp.route('/upload/<string:track_id>', methods=['POST'])
def upload_midi(track_id):
    """上传MIDI文件并关联到特定歌曲"""
    session = Session(bind=db.engine, autoflush=False)
    try:
        # 验证歌曲是否存在
        track = session.query(Track).filter_by(spotify_id=track_id).first()
        if not track:
            logger.error(f"未找到歌曲: track_id={track_id}")
            return jsonify({'error': '歌曲不存在'}), 404

        # 检查是否有文件上传
        if 'midi_file' not in request.files:
            logger.error("未提供MIDI文件")
            return jsonify({'error': '未提供MIDI文件'}), 400
        
        file = request.files['midi_file']
        
        # 检查文件名是否为空
        if file.filename == '':
            logger.error("未选择MIDI文件")
            return jsonify({'error': '未选择MIDI文件'}), 400
        
        # 检查文件类型
        if not allowed_file(file.filename):
            logger.error(f"不允许的文件类型: {file.filename}")
            return jsonify({'error': '只允许.mid和.midi文件'}), 400
        
        # 生成安全的文件名并确保唯一性
        filename = secure_filename(file.filename)
        unique_filename = f"{track_id}_{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # 保存文件
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # 获取描述和上传者信息
        description = request.form.get('description', '')
        uploaded_by = request.form.get('uploaded_by', 'anonymous')
        
        # 检查是否已存在该歌曲的MIDI文件
        existing_midi = session.query(Midi).filter_by(track_id=track_id).first()
        
        if existing_midi:
            # 更新已有记录
            # 删除旧文件
            try:
                if os.path.exists(existing_midi.file_path):
                    os.remove(existing_midi.file_path)
            except Exception as e:
                logger.warning(f"删除旧MIDI文件失败: {str(e)}")
            
            # 更新记录
            existing_midi.file_path = file_path
            existing_midi.original_filename = filename
            existing_midi.file_size = file_size
            existing_midi.updated_at = datetime.utcnow()
            existing_midi.description = description
            existing_midi.uploaded_by = uploaded_by
            
            logger.info(f"更新歌曲 {track_id} 的MIDI文件: {file_path}")
            midi = existing_midi
        else:
            # 创建新记录
            midi = Midi(
                track_id=track_id,
                file_path=file_path,
                original_filename=filename,
                file_size=file_size,
                description=description,
                uploaded_by=uploaded_by
            )
            session.add(midi)
            logger.info(f"为歌曲 {track_id} 添加MIDI文件: {file_path}")
        
        # 添加midi_url到track记录
        midi_url = f"/midis/download/{track_id}"
        track.midi_url = midi_url
        
        # 提交事务
        session.commit()
        
        # 返回成功响应
        return jsonify({
            'message': 'MIDI文件上传成功',
            'midi': {
                'id': midi.id,
                'track_id': midi.track_id,
                'original_filename': midi.original_filename,
                'file_size': midi.file_size,
                'created_at': midi.created_at.isoformat(),
                'updated_at': midi.updated_at.isoformat(),
                'midi_url': midi_url
            }
        }), 201
        
    except SQLAlchemyError as db_error:
        session.rollback()
        logger.error(f"数据库操作失败: {str(db_error)}")
        return jsonify({'error': '数据库错误，请稍后重试'}), 500
    except Exception as e:
        session.rollback()
        logger.error(f"上传MIDI文件失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@midis_bp.route('/download/<string:track_id>', methods=['GET'])
def download_midi(track_id):
    """下载指定歌曲的MIDI文件"""
    session = db.session()
    try:
        # 查找对应的MIDI记录
        midi = session.query(Midi).filter_by(track_id=track_id).first()
        
        if not midi:
            logger.error(f"未找到歌曲 {track_id} 的MIDI文件")
            return jsonify({'error': '未找到MIDI文件'}), 404
        
        # 检查文件是否存在
        if not os.path.exists(midi.file_path):
            logger.error(f"MIDI文件不存在: {midi.file_path}")
            return jsonify({'error': 'MIDI文件不存在'}), 404
        
        # 发送文件
        return send_file(
            midi.file_path,
            as_attachment=True,
            download_name=midi.original_filename,
            mimetype='audio/midi'
        )
    
    except Exception as e:
        logger.error(f"下载MIDI文件失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@midis_bp.route('/info/<string:track_id>', methods=['GET'])
def get_midi_info(track_id):
    """获取指定歌曲的MIDI文件信息"""
    session = db.session()
    try:
        # 查找对应的MIDI记录
        midi = session.query(Midi).filter_by(track_id=track_id).first()
        
        if not midi:
            logger.info(f"未找到歌曲 {track_id} 的MIDI文件信息")
            return jsonify({'exists': False}), 200
        
        # 返回MIDI信息
        return jsonify({
            'exists': True,
            'midi_info': {
                'id': midi.id,
                'track_id': midi.track_id,
                'original_filename': midi.original_filename,
                'file_size': midi.file_size,
                'created_at': midi.created_at.isoformat(),
                'updated_at': midi.updated_at.isoformat(),
                'description': midi.description,
                'uploaded_by': midi.uploaded_by,
                'midi_url': f"/midis/download/{track_id}"
            }
        }), 200
    
    except Exception as e:
        logger.error(f"获取MIDI信息失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@midis_bp.route('/delete/<string:track_id>', methods=['DELETE'])
def delete_midi(track_id):
    """删除指定歌曲的MIDI文件"""
    session = Session(bind=db.engine, autoflush=False)
    try:
        # 查找对应的MIDI记录
        midi = session.query(Midi).filter_by(track_id=track_id).first()
        
        if not midi:
            logger.error(f"未找到歌曲 {track_id} 的MIDI文件")
            return jsonify({'error': '未找到MIDI文件'}), 404
        
        # 删除文件
        if os.path.exists(midi.file_path):
            os.remove(midi.file_path)
        
        # 删除记录
        session.delete(midi)
        
        # 清除track中的midi_url
        track = session.query(Track).filter_by(spotify_id=track_id).first()
        if track:
            track.midi_url = None
        
        # 提交事务
        session.commit()
        
        return jsonify({'message': 'MIDI文件已成功删除'}), 200
    
    except Exception as e:
        session.rollback()
        logger.error(f"删除MIDI文件失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()