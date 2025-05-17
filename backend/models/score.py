from datetime import datetime
from database import db
from sqlalchemy.dialects.postgresql import JSON

class Score(db.Model):
    __tablename__ = 'scores'
    id = db.Column(db.Integer, primary_key=True)
    track_id = db.Column(db.String(255), db.ForeignKey('tracks.spotify_id'), nullable=False)  # 改为 String(255)
    score_data = db.Column(JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'track_id': self.track_id,
            'score_data': self.score_data,
            'created_at': self.created_at.isoformat()
        }