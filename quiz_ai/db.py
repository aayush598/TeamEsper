import sqlite3
from typing import List, Dict

DB_PATH = "quizzes.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        prompt TEXT
    )""")
    conn.commit()
    conn.close()

def insert_topic(name: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT OR IGNORE INTO topics (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

def get_topics() -> List[str]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT name FROM topics")
    rows = cur.fetchall()
    conn.close()
    return [r[0] for r in rows]

def insert_prompt(title: str, prompt: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO prompts (title, prompt) VALUES (?, ?)", (title, prompt))
    conn.commit()
    conn.close()

def get_prompts() -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title FROM prompts")
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "title": r[1]} for r in rows]

def get_prompt_by_id(pid: int) -> str:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT prompt FROM prompts WHERE id=?", (pid,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else ""
