# backend/models/chord_progression.py
from datetime import datetime
from database import db

class ChordProgression(db.Model):
    __tablename__ = 'chord_progressions'
    id = db.Column(db.Integer, primary_key=True)
    track_id = db.Column(db.String(255), db.ForeignKey('tracks.spotify_id'), nullable=False)
    section_name = db.Column(db.String(255), nullable=False)
    section_index = db.Column(db.Integer, nullable=False)
    progression = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'track_id': self.track_id,
            'section_name': self.section_name,
            'section_index': self.section_index,
            'progression': self.progression,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }