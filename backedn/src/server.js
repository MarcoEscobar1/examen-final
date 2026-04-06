import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import tareasRouter from './rutas/tareas.js'
import { pool, probarConexion } from './db.js'

dotenv.config()

const app = express()
const puerto = Number(process.env.PUERTO || 4000)
const origenFrontend = process.env.ORIGEN_FRONTEND || 'http://localhost:5173'

app.use(
  cors({
    origin: origenFrontend,
  }),
)
app.use(express.json())

app.get('/api/salud', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/tareas', tareasRouter)

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ mensaje: 'Error interno del servidor.' })
})

const iniciarServidor = async () => {
  await probarConexion()

  app.listen(puerto, () => {
    console.log(`API de tareas ejecutandose en http://localhost:${puerto}`)
  })
}

iniciarServidor().catch(async (error) => {
  console.error('No se pudo iniciar la API:', error.message)
  await pool.end()
  process.exit(1)
})
