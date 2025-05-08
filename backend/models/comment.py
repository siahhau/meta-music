from datetime import datetime
from database import db

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    album_id = db.Column(db.String(100), db.ForeignKey('albums.spotify_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=True, default=0)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'user': self.user,
            'score': self.score,
            'created_at': self.created_at.isoformat()
        }