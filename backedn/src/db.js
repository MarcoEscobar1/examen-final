import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL

const host = process.env.PGHOST || 'localhost'
const port = Number(process.env.PGPORT || 5432)
const user = process.env.PGUSER || 'postgres'
const password = process.env.PGPASSWORD || ''
const database = process.env.PGDATABASE

const configuracionPool = databaseUrl
  ? { connectionString: databaseUrl }
  : {
      host,
      port,
      user,
      password,
      database,
    }

if (!databaseUrl && !database) {
  throw new Error('Falta configurar PGDATABASE (o DATABASE_URL) en el entorno.')
}

export const pool = new Pool(configuracionPool)

export const probarConexion = async () => {
  const cliente = await pool.connect()
  try {
    await cliente.query('SELECT 1')
  } finally {
    cliente.release()
  }
}
