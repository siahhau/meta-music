# backend/config.py
import os
# 数据库配置
DB_HOST = os.getenv("DB_HOST", "cd-postgres-h62v2r9k.sql.tencentcdb.com")
DB_PORT = os.getenv("DB_PORT", "25175")
DB_USER = os.getenv("DB_USER", "siahhau")
DB_NAME = os.getenv("DB_NAME", "music_lib")
DB_PWD = os.getenv("DB_PWD")

class Config:
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PWD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30,
        'pool_pre_ping': True
    }