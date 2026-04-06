import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const filtro = req.query.filtro
  const filtroValido = filtro === 'pendientes' || filtro === 'completadas' || filtro === 'todas'

  let consulta = `
    SELECT
      id::text AS id,
      titulo,
      descripcion,
      completada,
      creada_en AS "creadaEn",
      actualizada_en AS "actualizadaEn"
    FROM tareas
  `

  const parametros = []

  if (filtroValido && filtro !== 'todas') {
    consulta += ' WHERE completada = $1'
    parametros.push(filtro === 'completadas')
  }

  consulta += ' ORDER BY creada_en DESC'

  const resultado = await pool.query(consulta, parametros)
  res.json(resultado.rows)
})

router.post('/', async (req, res) => {
  const titulo = req.body?.titulo?.trim()
  const descripcion = req.body?.descripcion?.trim() || null

  if (!titulo) {
    return res.status(400).json({ mensaje: 'El titulo es obligatorio.' })
  }

  const resultado = await pool.query(
    `
      INSERT INTO tareas (titulo, descripcion)
      VALUES ($1, $2)
      RETURNING
        id::text AS id,
        titulo,
        descripcion,
        completada,
        creada_en AS "creadaEn",
        actualizada_en AS "actualizadaEn"
    `,
    [titulo, descripcion],
  )

  res.status(201).json(resultado.rows[0])
})

router.patch('/:id', async (req, res) => {
  const id = req.params.id
  const tituloEntrada = req.body?.titulo
  const descripcionEntrada = req.body?.descripcion
  const completadaEntrada = req.body?.completada

  const titulo = typeof tituloEntrada === 'string' ? tituloEntrada.trim() : undefined
  const descripcion =
    typeof descripcionEntrada === 'string' ? descripcionEntrada.trim() : descripcionEntrada

  if (
    titulo === undefined &&
    descripcion === undefined &&
    typeof completadaEntrada !== 'boolean'
  ) {
    return res.status(400).json({ mensaje: 'No hay campos para actualizar.' })
  }

  if (titulo !== undefined && titulo.length === 0) {
    return res.status(400).json({ mensaje: 'El titulo no puede estar vacio.' })
  }

  const resultado = await pool.query(
    `
      UPDATE tareas
      SET
        titulo = COALESCE($2, titulo),
        descripcion = COALESCE($3, descripcion),
        completada = COALESCE($4, completada)
      WHERE id = $1
      RETURNING
        id::text AS id,
        titulo,
        descripcion,
        completada,
        creada_en AS "creadaEn",
        actualizada_en AS "actualizadaEn"
    `,
    [
      id,
      titulo ?? null,
      descripcion === undefined ? null : descripcion,
      typeof completadaEntrada === 'boolean' ? completadaEntrada : null,
    ],
  )

  if (resultado.rowCount === 0) {
    return res.status(404).json({ mensaje: 'Tarea no encontrada.' })
  }

  res.json(resultado.rows[0])
})

router.delete('/completadas', async (_req, res) => {
  const resultado = await pool.query('DELETE FROM tareas WHERE completada = TRUE')
  res.json({ eliminadas: resultado.rowCount ?? 0 })
})

router.delete('/:id', async (req, res) => {
  const resultado = await pool.query('DELETE FROM tareas WHERE id = $1', [req.params.id])

  if (resultado.rowCount === 0) {
    return res.status(404).json({ mensaje: 'Tarea no encontrada.' })
  }

  res.status(204).send()
})

export default router
