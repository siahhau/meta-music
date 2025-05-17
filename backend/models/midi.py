# backend/models/midi.py
from datetime import datetime
from database import db

class Midi(db.Model):
    __tablename__ = 'midis'
    id = db.Column(db.Integer, primary_key=True)
    track_id = db.Column(db.String(255), db.ForeignKey('tracks.spotify_id'), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)  # 存储MIDI文件路径
    original_filename = db.Column(db.String(255), nullable=False)  # 原始文件名
    file_size = db.Column(db.Integer, nullable=False)  # 文件大小（字节）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = db.Column(db.Text, nullable=True)  # 可选描述
    uploaded_by = db.Column(db.String(255), nullable=True)  # 上传者信息

    def to_dict(self):
        return {
            'id': self.id,
            'track_id': self.track_id,
            'file_path': self.file_path,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'description': self.description,
            'uploaded_by': self.uploaded_by
        }