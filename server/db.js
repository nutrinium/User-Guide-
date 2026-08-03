import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { slugifyAppCode } from './utils/appCode.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'USER_GUIDE',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
})

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(64) DEFAULT 'LayoutGrid',
      color VARCHAR(32) DEFAULT '#2563eb',
      logo_url VARCHAR(512) DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY uk_applications_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await ensureColumn('applications', 'code', 'VARCHAR(64) NULL')
  await ensureColumn('applications', 'logo_url', 'VARCHAR(512) DEFAULT NULL')
  await backfillApplicationCodes()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id VARCHAR(64) PRIMARY KEY,
      application_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(64) DEFAULT 'FileText',
      color VARCHAR(32) DEFAULT '#2563eb',
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_modules_app (application_id),
      CONSTRAINT fk_modules_app FOREIGN KEY (application_id)
        REFERENCES applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guides (
      id VARCHAR(64) PRIMARY KEY,
      application_id VARCHAR(64) NOT NULL,
      module_id VARCHAR(64) DEFAULT '',
      title VARCHAR(255) NOT NULL,
      description TEXT,
      sections JSON,
      status ENUM('draft','published') DEFAULT 'draft',
      sort_order INT DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      published_at DATETIME NULL,
      INDEX idx_guides_app (application_id),
      INDEX idx_guides_module (module_id),
      CONSTRAINT fk_guides_app FOREIGN KEY (application_id)
        REFERENCES applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media (
      id VARCHAR(64) PRIMARY KEY,
      application_id VARCHAR(64) NOT NULL DEFAULT '',
      module_id VARCHAR(64) DEFAULT '',
      guide_id VARCHAR(64) DEFAULT '',
      section_id VARCHAR(64) DEFAULT '',
      guide_title VARCHAR(255) DEFAULT '',
      section_title VARCHAR(255) DEFAULT '',
      type ENUM('video','photo','document','content') NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      file_name VARCHAR(255) DEFAULT '',
      file_type VARCHAR(128) DEFAULT '',
      file_size INT DEFAULT 0,
      content_text LONGTEXT,
      file_data LONGTEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_media_guide (guide_id),
      INDEX idx_media_module (module_id),
      INDEX idx_media_app (application_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      key_hash VARCHAR(128) NOT NULL,
      key_prefix VARCHAR(16) NOT NULL,
      application_id VARCHAR(64) DEFAULT NULL,
      permission ENUM('read') DEFAULT 'read',
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NULL,
      last_used_at DATETIME NULL,
      INDEX idx_api_keys_hash (key_hash),
      INDEX idx_api_keys_app (application_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
}

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  if (rows[0].cnt === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

async function backfillApplicationCodes() {
  const [rows] = await pool.query(
    `SELECT id, name, code FROM applications WHERE code IS NULL OR code = ''`
  )
  for (const row of rows) {
    let code = slugifyAppCode(row.name) || `APP_${row.id.slice(-6).toUpperCase()}`
    let suffix = 1
    while (true) {
      const [existing] = await pool.query(`SELECT id FROM applications WHERE code = ? AND id != ?`, [
        code,
        row.id,
      ])
      if (existing.length === 0) break
      suffix += 1
      code = `${slugifyAppCode(row.name)}_${suffix}`
    }
    await pool.query(`UPDATE applications SET code = ? WHERE id = ?`, [code, row.id])
  }

  await pool.query(`ALTER TABLE applications MODIFY COLUMN code VARCHAR(64) NOT NULL`)
  try {
    await pool.query(`ALTER TABLE applications ADD UNIQUE KEY uk_applications_code (code)`)
  } catch {
    /* index may already exist */
  }
}

function toMysqlDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export function mapApplication(row) {
  if (!row) return null
  return {
    id: row.id,
    code: row.code || slugifyAppCode(row.name),
    name: row.name,
    description: row.description || '',
    icon: row.icon || 'LayoutGrid',
    color: row.color || '#2563eb',
    logoUrl: row.logo_url || null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }
}

export function mapModule(row) {
  if (!row) return null
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    description: row.description || '',
    icon: row.icon || 'FileText',
    color: row.color || '#2563eb',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }
}

export function mapGuide(row) {
  if (!row) return null
  let sections = row.sections
  if (typeof sections === 'string') {
    try {
      sections = JSON.parse(sections)
    } catch {
      sections = []
    }
  }
  return {
    id: row.id,
    applicationId: row.application_id,
    moduleId: row.module_id || '',
    title: row.title,
    description: row.description || '',
    sections: Array.isArray(sections) ? sections : [],
    status: row.status || 'draft',
    order: row.sort_order ?? 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
  }
}

export function mapMedia(row, includeFile = false) {
  if (!row) return null
  const item = {
    id: row.id,
    applicationId: row.application_id || '',
    moduleId: row.module_id || '',
    guideId: row.guide_id || '',
    sectionId: row.section_id || '',
    guideTitle: row.guide_title || '',
    sectionTitle: row.section_title || '',
    type: row.type,
    name: row.name,
    description: row.description || '',
    fileName: row.file_name || '',
    fileType: row.file_type || '',
    fileSize: row.file_size || 0,
    contentText: row.content_text || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }
  if (includeFile && row.file_data) {
    item.fileData = row.file_data
  }
  return item
}

export { toMysqlDate }

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
