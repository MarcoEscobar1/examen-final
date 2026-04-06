import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const main = async () => {
  const rutaSchema = resolve(__dirname, '../../database/schema.sql')
  const sql = await readFile(rutaSchema, 'utf8')

  await pool.query(sql)
  await pool.end()

  console.log('Schema aplicado correctamente.')
}

main().catch(async (error) => {
  console.error('Error aplicando schema:', error.message)
  await pool.end()
  process.exit(1)
})
