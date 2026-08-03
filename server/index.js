import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import apiRouter, { initSchema } from './routes.js'
import viewV1Router from './routes/viewV1.js'
import apiKeysRouter from './routes/apiKeys.js'
import { pool } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const app = express()
const PORT = Number(process.env.PORT || 3001)

const uploadBodyLimit = process.env.MAX_UPLOAD_BODY || '200mb'

app.use(cors())
app.use(express.json({ limit: uploadBodyLimit }))

app.use('/api', apiRouter)
app.use('/api/v1/view', viewV1Router)
app.use('/api/view', viewV1Router)
app.use('/api/api-keys', apiKeysRouter)

async function start() {
  try {
    await initSchema()
    await pool.query('SELECT 1')
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`)
      console.log(`MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
      console.log(`Public View API: http://localhost:${PORT}/api/v1/view`)
    })
  } catch (err) {
    console.error('\n❌ Failed to start server:', err.message)
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.error('\n→ Cannot reach MySQL. Check DB_HOST, DB_PORT, and firewall (port 3306).')
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n→ MySQL rejected credentials. Copy .env.example to .env and set DB_USER / DB_PASSWORD.')
    }
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'your_password_here') {
      console.error('\n→ Missing .env file or placeholder password. Run: cp .env.example .env')
    }
    console.error(`\n→ Config: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'USER_GUIDE'}\n`)
    process.exit(1)
  }
}

start()
