import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.resolve(process.cwd(), 'data/blog.db')

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 初始化数据库表结构与触发器
export function initDb(): void {
  db.exec(`
    -- 文章表
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      cover_image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    -- 标签表
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    -- 文章-标签多对多关联
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    -- 全文搜索虚拟表（trigram 分词器，支持中文）
    CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
      title,
      content,
      content='posts',
      content_rowid='id',
      tokenize='trigram'
    );

    -- FTS5 同步触发器
    CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
      INSERT INTO posts_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
      INSERT INTO posts_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
    END;

    CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
  `)

  // 软删除字段迁移（兼容已有数据库）
  const cols = db.prepare('PRAGMA table_info(posts)').all() as { name: string }[]
  if (!cols.some((c) => c.name === 'deleted_at')) {
    db.exec('ALTER TABLE posts ADD COLUMN deleted_at TEXT')
  }
}
