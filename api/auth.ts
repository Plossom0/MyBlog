import crypto from 'crypto'
import { db } from './db'

// 超级管理员固定为单例：id=1
const ADMIN_ID = 1

export function md5(text: string): string {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex')
}

interface AdminRow {
  id: number
  username: string | null
  password_md5: string | null
  session_token: string | null
}

function getAdmin(): AdminRow | undefined {
  return db.prepare('SELECT * FROM admin WHERE id = ?').get(ADMIN_ID) as
    | AdminRow
    | undefined
}

export interface PasswordStatus {
  passwordSet: boolean
  username: string | null
}

export function getPasswordStatus(): PasswordStatus {
  const row = getAdmin()
  return {
    passwordSet: !!row && !!row.password_md5,
    username: row?.username ?? null,
  }
}

export function isPasswordSet(): boolean {
  return getPasswordStatus().passwordSet
}

// 首次设置：存储用户名和 md5 密码，并直接签发一个会话 token
export function setPassword(username: string, password: string): { token: string; username: string } {
  const hash = md5(password)
  const token = crypto.randomBytes(24).toString('hex')
  db.prepare(
    `UPDATE admin SET username = ?, password_md5 = ?, session_token = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(username, hash, token, ADMIN_ID)
  return { token, username }
}

// 登录：校验用户名和 md5 密码，通过则签发新 token
export function login(username: string, password: string): { token: string; username: string } | null {
  const row = getAdmin()
  if (!row || !row.password_md5 || !row.username) return null
  if (username !== row.username) return null
  if (md5(password) !== row.password_md5) return null
  const token = crypto.randomBytes(24).toString('hex')
  db.prepare(
    `UPDATE admin SET session_token = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(token, ADMIN_ID)
  return { token, username }
}

export function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false
  const row = getAdmin()
  if (!row || !row.session_token) return false
  return row.session_token === token
}

export function logout(token: string): void {
  if (verifyToken(token)) {
    db.prepare('UPDATE admin SET session_token = NULL WHERE id = ?').run(ADMIN_ID)
  }
}
