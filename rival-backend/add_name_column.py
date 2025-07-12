#!/usr/bin/env python3
import os
import sys
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

def add_name_column():
    db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # nameカラムを追加
        cursor.execute("ALTER TABLE user ADD COLUMN name VARCHAR(100) DEFAULT 'ユーザー'")
        
        # 既存のユーザーにデフォルト名を設定
        cursor.execute("UPDATE user SET name = 'ユーザー' WHERE name IS NULL OR name = ''")
        
        conn.commit()
        conn.close()
        
        print("nameカラムを追加し、既存ユーザーにデフォルト名を設定しました。")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("nameカラムは既に存在します。")
        else:
            print(f"エラー: {e}")

if __name__ == "__main__":
    add_name_column()