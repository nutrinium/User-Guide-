import { spawn } from 'child_process'

const isWin = process.platform === 'win32'
const npm = isWin ? 'npm.cmd' : 'npm'

function run(label, args) {
  const child = spawn(npm, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`)
    }
  })
  return child
}

console.log('Starting API (port 3001) and frontend (Vite)...\n')

const api = run('api', ['run', 'dev:server'])
const web = run('web', ['run', 'dev'])

function shutdown() {
  api.kill('SIGTERM')
  web.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
