# backend/routes/tracks.py
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import json
from models.track import Track
from models.score import Score
from models.chord_progression import ChordProgression
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

@tracks_bp.route('/spotify/<string:spotify_id>/similar-structure', methods=['GET'])
def get_similar_structure_tracks(spotify_id):
    """获取具有相同歌曲结构的其他歌曲"""
    session = db.session()
    try:
        # 获取当前歌曲的结构
        current_track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        if not current_track or not current_track.sections:
            logger.info(f"歌曲 {spotify_id} 无结构数据")
            return jsonify({"tracks": []}), 200
        
        # 获取所有有sections数据的其他歌曲
        all_tracks = session.query(Track).filter(
            Track.spotify_id != spotify_id,
            Track.sections.isnot(None)
        ).all()
        
        # 在Python中比较sections的相等性
        similar_tracks = []
        current_sections = current_track.sections
        for track in all_tracks:
            if track.sections == current_sections:  # Python的列表比较
                similar_tracks.append(track)
            if len(similar_tracks) >= 10:  # 最多返回10首
                break
        
        return jsonify({
            "tracks": [track.to_dict() for track in similar_tracks]
        }), 200
    except Exception as e:
        logger.error(f"查询相似结构歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/similar-key', methods=['GET'])
def get_similar_key_tracks(spotify_id):
    """获取具有相同调性的其他歌曲"""
    session = db.session()
    try:
        # 获取当前歌曲的调性
        current_track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        if not current_track or not current_track.key or not current_track.scale:
            logger.info(f"歌曲 {spotify_id} 无调性数据")
            return jsonify({"tracks": []}), 200
        
        # 获取所有具有相同调性的其他歌曲
        similar_tracks = session.query(Track).filter(
            Track.spotify_id != spotify_id,
            Track.key == current_track.key,
            Track.scale == current_track.scale,
            Track.key.isnot(None),
            Track.scale.isnot(None)
        ).limit(10).all()
        
        return jsonify({
            "tracks": [track.to_dict() for track in similar_tracks]
        }), 200
    except Exception as e:
        logger.error(f"查询相同调性歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/similar-year', methods=['GET'])
def get_similar_year_tracks(spotify_id):
    """获取同一年发行的其他歌曲"""
    session = db.session()
    try:
        # 获取请求参数中的年份
        year = request.args.get('year')
        if not year:
            # 如果没有提供年份，尝试从当前歌曲中获取
            current_track = session.query(Track).filter_by(spotify_id=spotify_id).first()
            if not current_track or not current_track.release_date:
                logger.info(f"歌曲 {spotify_id} 无发行日期数据")
                return jsonify({"tracks": []}), 200
                
            # 从日期中提取年份
            if current_track.release_date:
                year = str(current_track.release_date).split('-')[0]
            
        if not year:
            logger.info("无法确定年份")
            return jsonify({"tracks": []}), 200
            
        # 构建日期范围查询条件（从年份开始到年份结束）
        year_start = f"{year}-01-01"
        year_end = f"{year}-12-31"
        
        # 获取同一年发行的其他歌曲
        similar_tracks = session.query(Track).filter(
            Track.spotify_id != spotify_id,
            Track.release_date.isnot(None),
            Track.release_date >= year_start,
            Track.release_date <= year_end
        ).order_by(Track.popularity.desc()).limit(12).all()
        
        return jsonify({
            "tracks": [track.to_dict() for track in similar_tracks]
        }), 200
    except Exception as e:
        logger.error(f"查询同年发行歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/similar-duration', methods=['GET'])
def get_similar_duration_tracks(spotify_id):
    """获取相似时长的其他歌曲"""
    session = db.session()
    try:
        # 获取请求参数
        duration_ms = request.args.get('duration_ms')
        range_seconds = request.args.get('range_seconds', '30')  # 默认±30秒范围
        
        # 转换参数类型
        try:
            if duration_ms:
                duration_ms = int(duration_ms)
            else:
                # 如果没有提供持续时间，从当前歌曲获取
                current_track = session.query(Track).filter_by(spotify_id=spotify_id).first()
                if not current_track or not current_track.duration_ms:
                    logger.info(f"歌曲 {spotify_id} 无持续时间数据")
                    return jsonify({"tracks": []}), 200
                duration_ms = current_track.duration_ms
                
            range_seconds = int(range_seconds)
        except (ValueError, TypeError) as e:
            logger.error(f"参数类型转换失败: {str(e)}")
            return jsonify({'error': '无效的参数类型'}), 400
        
        # 计算持续时间范围（毫秒）
        range_ms = range_seconds * 1000
        min_duration = max(0, duration_ms - range_ms)  # 确保不小于0
        max_duration = duration_ms + range_ms
        
        # 查询相似持续时间的歌曲
        similar_tracks = session.query(Track).filter(
            Track.spotify_id != spotify_id,
            Track.duration_ms.isnot(None),
            Track.duration_ms >= min_duration,
            Track.duration_ms <= max_duration
        ).order_by(
            # 按持续时间差升序排序（最接近的优先）
            db.func.abs(Track.duration_ms - duration_ms)
        ).limit(15).all()
        
        return jsonify({
            "tracks": [track.to_dict() for track in similar_tracks]
        }), 200
    except Exception as e:
        logger.error(f"查询相似时长歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/similar-chords', methods=['GET'])
def get_similar_chord_tracks(spotify_id):
    """获取和弦相似的其他歌曲"""
    session = db.session()
    try:
        # 获取当前歌曲的和弦
        current_track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        
        if not current_track or not current_track.chords:
            logger.info(f"歌曲 {spotify_id} 无和弦数据")
            return jsonify({"tracks": []}), 200
        
        # 解析和弦数据
        current_chords = []
        try:
            # 尝试作为JSON解析 - 期望是一个和弦数组: ['C', 'E', 'F', ...]
            parsed_chords = json.loads(current_track.chords)
            if isinstance(parsed_chords, list):
                current_chords = parsed_chords
            else:
                logger.warning(f"歌曲 {spotify_id} 的和弦数据格式不符合预期: {current_track.chords}")
        except (json.JSONDecodeError, TypeError):
            # 如果不是有效的JSON，尝试作为逗号分隔的字符串处理
            if isinstance(current_track.chords, str):
                current_chords = [c.strip() for c in current_track.chords.split(',')]
        
        if not current_chords:
            logger.info(f"无法解析歌曲 {spotify_id} 的和弦数据")
            return jsonify({"tracks": []}), 200
        
        logger.info(f"当前歌曲和弦: {current_chords}")
            
        # 查找具有相似和弦的歌曲
        similar_tracks = []
        all_tracks = session.query(Track).filter(
            Track.spotify_id != spotify_id,
            Track.chords.isnot(None)
        ).all()
        
        # 查找至少有2个相同和弦的歌曲
        for track in all_tracks:
            if not track.chords:
                continue
                
            track_chords = []
            try:
                # 尝试作为JSON解析
                parsed_chords = json.loads(track.chords)
                if isinstance(parsed_chords, list):
                    track_chords = parsed_chords
                else:
                    # 不是期望的数组格式，跳过
                    continue
            except (json.JSONDecodeError, TypeError):
                # 如果不是有效的JSON，尝试作为逗号分隔的字符串处理
                if isinstance(track.chords, str):
                    track_chords = [c.strip() for c in track.chords.split(',')]
            
            if not track_chords:
                continue
                
            # 计算两个歌曲之间的和弦重叠
            common_chords = set(current_chords) & set(track_chords)
            
            # 如果有至少2个共同和弦，认为是相似的
            if len(common_chords) >= 2:
                # 计算一个相似度分数 - 调整权重使共同和弦更重要
                common_ratio = len(common_chords) / len(track_chords)
                order_similarity = 0.0
                
                # 加分项：如果和弦顺序也相似（最多考虑前4个）
                for i in range(min(4, len(current_chords), len(track_chords))):
                    if i < len(current_chords) and i < len(track_chords) and current_chords[i] == track_chords[i]:
                        order_similarity += 0.1
                
                # 综合评分：共同和弦比例 + 顺序相似度 + 额外加成（使用相同主要和弦）
                major_chord_bonus = 0.1 if "C" in common_chords or "G" in common_chords or "F" in common_chords else 0
                similarity_score = common_ratio + order_similarity + major_chord_bonus
                
                similar_tracks.append((track, similarity_score))
        
        # 按相似度排序，取前12首
        similar_tracks.sort(key=lambda x: x[1], reverse=True)
        top_tracks = [track for track, score in similar_tracks[:12]]
        
        return jsonify({
            "tracks": [track.to_dict() for track in top_tracks]
        }), 200
    except Exception as e:
        logger.error(f"查询相似和弦歌曲失败 for track {spotify_id}: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

@tracks_bp.route('/spotify/<string:spotify_id>/chord-progressions', methods=['POST'])
def save_chord_progression(spotify_id):
    """保存歌曲某个段落的和弦进行"""
    session = Session(bind=db.engine, autoflush=False)  # 使用独立会话，禁用 autoflush
    try:
        data = request.get_json()
        logger.info(f"收到和弦进行保存请求: {data}")
        
        if not data or not all(key in data for key in ['chordProgression', 'sectionName', 'sectionIndex']):
            logger.error("请求数据缺少必要字段")
            return jsonify({'error': '缺少必要字段: chordProgression, sectionName, sectionIndex'}), 400
        
        # 检查歌曲是否存在
        track = session.query(Track).filter_by(spotify_id=spotify_id).first()
        if not track:
            logger.error(f"未找到歌曲: spotify_id={spotify_id}")
            return jsonify({'error': '歌曲不存在'}), 404
        
        # 检查是否已存在该段落的和弦进行
        with session.no_autoflush:
            existing = session.query(ChordProgression).filter_by(
                track_id=spotify_id,
                section_index=data['sectionIndex']
            ).first()
        
        if existing:
            # 更新现有和弦进行
            existing.progression = data['chordProgression']
            existing.section_name = data['sectionName']
            session.flush()
            session.commit()
            logger.info(f"更新了歌曲 {spotify_id} 的和弦进行: 段落={data['sectionName']}")
            return jsonify(existing.to_dict()), 200
        else:
            # 创建新的和弦进行记录
            progression = ChordProgression(
                track_id=spotify_id,
                section_name=data['sectionName'],
                section_index=data['sectionIndex'],
                progression=data['chordProgression']
            )
            session.add(progression)
            session.flush()
            session.commit()
            logger.info(f"添加了歌曲 {spotify_id} 的和弦进行: 段落={data['sectionName']}")
            return jsonify(progression.to_dict()), 201
    
    except SQLAlchemyError as db_error:
        session.rollback()
        logger.error(f"数据库错误: {str(db_error)}")
        return jsonify({'error': '数据库错误，请稍后重试'}), 500
    except Exception as e:
        session.rollback()
        logger.error(f"保存和弦进行失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

# 获取歌曲的所有和弦进行
@tracks_bp.route('/spotify/<string:spotify_id>/chord-progressions', methods=['GET'])
def get_chord_progressions(spotify_id):
    """获取歌曲的所有和弦进行"""
    session = db.session()
    try:
        progressions = session.query(ChordProgression).filter_by(track_id=spotify_id).order_by(ChordProgression.section_index).all()
        
        return jsonify({
            'count': len(progressions),
            'items': [prog.to_dict() for prog in progressions]
        }), 200
    except Exception as e:
        logger.error(f"获取和弦进行失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

# 添加到 backend/routes/tracks.py 文件中

@tracks_bp.route('/search-by-progression', methods=['GET'])
def search_by_progression():
    """搜索包含特定和弦进行的歌曲"""
    session = db.session()
    try:
        # 获取查询参数
        progression = request.args.get('progression', '')
        if not progression:
            return jsonify({'error': '缺少和弦进行参数'}), 400
            
        logger.info(f"搜索和弦进行: {progression}")
        
        # 将输入的和弦进行拆分为数组
        chords = progression.split()
        if not chords:
            return jsonify({'error': '无效的和弦进行格式'}), 400
        
        # 首先获取所有已保存的和弦进行
        all_progressions = session.query(ChordProgression).all()
        
        # 保存匹配结果
        matched_tracks = []
        
        # 计算相似度和匹配分数
        for prog in all_progressions:
            track_id = prog.track_id
            saved_progression = prog.progression.split()
            
            # 计算匹配分数
            match_score = calculate_progression_similarity(chords, saved_progression)
            
            # 只保留匹配分数大于阈值的结果
            if match_score > 0.1:  # 10% 的最小匹配度
                # 检查是否已经添加过该歌曲
                existing_track = next((t for t in matched_tracks if t['track_id'] == track_id), None)
                
                if existing_track:
                    # 如果已存在该歌曲，保留匹配度更高的那个记录
                    if match_score > existing_track['match_score']:
                        existing_track['match_score'] = match_score
                        existing_track['matched_section'] = prog.section_name
                else:
                    # 添加新的匹配记录
                    matched_tracks.append({
                        'track_id': track_id,
                        'match_score': match_score,
                        'matched_section': prog.section_name
                    })
        
        # 按匹配分数降序排序
        matched_tracks.sort(key=lambda x: x['match_score'], reverse=True)
        
        # 最多返回15首歌曲
        top_matches = matched_tracks[:15]
        
        # 获取歌曲详细信息
        result_tracks = []
        for match in top_matches:
            track = session.query(Track).filter_by(spotify_id=match['track_id']).first()
            if track:
                track_data = track.to_dict()
                # 添加匹配分数和匹配的段落信息
                track_data['match_score'] = match['match_score']
                track_data['matched_section'] = match['matched_section']
                result_tracks.append(track_data)
        
        return jsonify({
            'count': len(result_tracks),
            'tracks': result_tracks
        }), 200
        
    except Exception as e:
        logger.error(f"搜索和弦进行失败: {str(e)}")
        return jsonify({'error': '服务器内部错误，请稍后重试'}), 500
    finally:
        session.close()

def calculate_progression_similarity(query_chords, saved_chords):
    """计算两个和弦进行之间的相似度"""
    if not query_chords or not saved_chords:
        return 0.0
    
    # 计算最长公共子序列 (LCS)
    lcs_length = longest_common_subsequence(query_chords, saved_chords)
    
    # 计算连续匹配的和弦数量
    consecutive_matches = longest_consecutive_match(query_chords, saved_chords)
    
    # 计算准确匹配的和弦数量
    exact_matches = sum(1 for i in range(min(len(query_chords), len(saved_chords))) 
                        if query_chords[i] == saved_chords[i])
    
    # 计算包含匹配
    contained_matches = sum(1 for chord in query_chords if chord in saved_chords)
    
    # 使用加权方式计算总体匹配分数
    total_weight = 0.4 + 0.3 + 0.2 + 0.1  # 权重总和为1
    
    # 不同匹配类型的加权得分
    lcs_score = (lcs_length / len(query_chords)) * 0.4  # 最长公共子序列(40%)
    consecutive_score = (consecutive_matches / len(query_chords)) * 0.3  # 连续匹配(30%)
    exact_score = (exact_matches / len(query_chords)) * 0.2  # 精确位置匹配(20%) 
    contained_score = (contained_matches / len(query_chords)) * 0.1  # 包含匹配(10%)
    
    # 总体匹配分数
    similarity = lcs_score + consecutive_score + exact_score + contained_score
    
    return min(1.0, similarity)  # 确保分数不超过1.0

def longest_common_subsequence(str1, str2):
    """计算最长公共子序列的长度"""
    m, n = len(str1), len(str2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if str1[i-1] == str2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]

def longest_consecutive_match(str1, str2):
    """计算最长连续匹配片段的长度"""
    m, n = len(str1), len(str2)
    max_length = 0
    
    for i in range(m):
        for j in range(n):
            length = 0
            while (i + length < m and j + length < n and 
                   str1[i + length] == str2[j + length]):
                length += 1
            max_length = max(max_length, length)
    
    return max_length