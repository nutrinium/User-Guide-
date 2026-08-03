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

app.use(cors())
app.use(express.json({ limit: '50mb' }))

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
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
