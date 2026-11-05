import http from 'node:http'
import { assertProductionConfiguration, config } from './config.js'
import { createApp } from './app.js'
import { initializeDatabase, pool } from './db.js'
import { initializeRealtime } from './realtime.js'

async function start() {
  assertProductionConfiguration()
  await initializeDatabase()
  const app = await createApp()
  const server = http.createServer(app)
  initializeRealtime(server)
  server.listen(config.port, () => {
    console.log(`Brahmam Foundation API listening on port ${config.port}`)
  })

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down.`)
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch((error) => {
  console.error('Unable to start API', error)
  process.exit(1)
})
