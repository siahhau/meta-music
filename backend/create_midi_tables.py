# create_midi_tables.py
import psycopg2
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "cd-postgres-h62v2r9k.sql.tencentcdb.com")
DB_PORT = os.getenv("DB_PORT", "25175")
DB_USER = os.getenv("DB_USER", "siahhau")
DB_NAME = os.getenv("DB_NAME", "music_lib")
DB_PWD = os.getenv("DB_PWD")

# 连接数据库
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PWD,
    dbname=DB_NAME
)

try:
    # 创建游标
    cur = conn.cursor()
    
    # 检查tracks表是否存在midi_url列
    cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'tracks' AND column_name = 'midi_url'
    """)
    
    # 如果midi_url列不存在，添加它
    if cur.fetchone() is None:
        print("添加 midi_url 列到 tracks 表...")
        cur.execute("ALTER TABLE tracks ADD COLUMN midi_url VARCHAR(512)")
    else:
        print("midi_url 列已存在")
    
    # 检查midis表是否存在
    cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'midis'
    )
    """)
    
    # 如果midis表不存在，创建它
    if not cur.fetchone()[0]:
        print("创建 midis 表...")
        cur.execute("""
        CREATE TABLE midis (
            id SERIAL PRIMARY KEY,
            track_id VARCHAR(255) NOT NULL REFERENCES tracks(spotify_id),
            file_path VARCHAR(512) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_size INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            uploaded_by VARCHAR(255)
        )
        """)
    else:
        print("midis 表已存在")
    
    # 提交事务
    conn.commit()
    print("数据库更新成功")
    
except Exception as e:
    # 回滚事务
    conn.rollback()
    print(f"发生错误: {str(e)}")
    
finally:
    # 关闭游标和连接
    if 'cur' in locals():
        cur.close()
    conn.close()