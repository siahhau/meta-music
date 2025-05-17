# fix_migration.py
from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text("DELETE FROM alembic_version"))
        db.session.commit()
        print("已成功清空 alembic_version 表")
    except Exception as e:
        db.session.rollback()
        print(f"发生错误: {str(e)}")