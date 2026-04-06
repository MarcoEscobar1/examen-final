import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type EstadoFiltro = 'todas' | 'pendientes' | 'completadas'

type Tarea = {
  id: string
  titulo: string
  descripcion?: string | null
  completada: boolean
  creadaEn: string
  actualizadaEn: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const filtroEtiquetas: Record<EstadoFiltro, string> = {
  todas: 'todas',
  pendientes: 'pendientes',
  completadas: 'completadas',
}

function App() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [titulo, setTitulo] = useState('')
  const [filtro, setFiltro] = useState<EstadoFiltro>('todas')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargarTareas = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const respuesta = await fetch(`${API_URL}/tareas`)

      if (!respuesta.ok) {
        throw new Error('No se pudo cargar la lista de tareas.')
      }

      const datos = (await respuesta.json()) as Tarea[]
      setTareas(datos)
    } catch {
      setError('No fue posible conectar con el backend.')
      setTareas([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarTareas()
  }, [cargarTareas])

  const tareasFiltradas = useMemo(() => {
    if (filtro === 'pendientes') {
      return tareas.filter((tarea) => !tarea.completada)
    }

    if (filtro === 'completadas') {
      return tareas.filter((tarea) => tarea.completada)
    }

    return tareas
  }, [filtro, tareas])

  const resumen = useMemo(() => {
    const completadas = tareas.filter((tarea) => tarea.completada).length
    const pendientes = tareas.length - completadas

    return {
      total: tareas.length,
      pendientes,
      completadas,
    }
  }, [tareas])

  const crearTarea = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const tituloLimpio = titulo.trim()
    if (!tituloLimpio) {
      return
    }

    setError('')

    try {
      const respuesta = await fetch(`${API_URL}/tareas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ titulo: tituloLimpio }),
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo crear la tarea.')
      }

      setTitulo('')
      await cargarTareas()
    } catch {
      setError('No se pudo crear la tarea.')
    }
  }

  const alternarEstado = async (id: string, completadaActual: boolean) => {
    setError('')

    try {
      const respuesta = await fetch(`${API_URL}/tareas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completada: !completadaActual }),
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo actualizar la tarea.')
      }

      await cargarTareas()
    } catch {
      setError('No se pudo actualizar la tarea.')
    }
  }

  const eliminarTarea = async (id: string) => {
    setError('')

    try {
      const respuesta = await fetch(`${API_URL}/tareas/${id}`, {
        method: 'DELETE',
      })

      if (!respuesta.ok && respuesta.status !== 204) {
        throw new Error('No se pudo eliminar la tarea.')
      }

      await cargarTareas()
    } catch {
      setError('No se pudo eliminar la tarea.')
    }
  }

  const limpiarCompletadas = async () => {
    setError('')

    try {
      const respuesta = await fetch(`${API_URL}/tareas/completadas`, {
        method: 'DELETE',
      })

      if (!respuesta.ok) {
        throw new Error('No se pudieron limpiar las completadas.')
      }

      await cargarTareas()
    } catch {
      setError('No se pudieron limpiar las completadas.')
    }
  }

  return (
    <main className="app">
      <section className="panel">
        <header className="encabezado">
          <p className="kicker">tareas to do examen final</p>
          <h1>lista de tareas</h1>
          <p className="subtitulo">conectada al backend y base de datos postgres</p>
        </header>

        <form className="formulario" onSubmit={(evento) => void crearTarea(evento)}>
          <label htmlFor="nueva-tarea" className="sr-only">
            ingrese una tarea nueva
          </label>
          <input
            id="nueva-tarea"
            type="text"
            placeholder="ej hacer crud"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            maxLength={150}
          />
          <button type="submit">agregar</button>
        </form>

        <section className="resumen" aria-label="resumen de tareas">
          <article>
            <span>{resumen.total}</span>
            <p>total</p>
          </article>
          <article>
            <span>{resumen.pendientes}</span>
            <p>pendientes</p>
          </article>
          <article>
            <span>{resumen.completadas}</span>
            <p>completadas</p>
          </article>
        </section>

        <section className="barra-filtros" aria-label="filtros">
          {(Object.keys(filtroEtiquetas) as EstadoFiltro[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              className={filtro === opcion ? 'activo' : ''}
              onClick={() => setFiltro(opcion)}
            >
              {filtroEtiquetas[opcion]}
            </button>
          ))}
          <button
            type="button"
            className="secundario"
            onClick={() => void limpiarCompletadas()}
            disabled={resumen.completadas === 0}
          >
            limpiar completadas
          </button>
        </section>

        {error ? <p className="mensaje-error">{error}</p> : null}

        <ul className="lista" aria-live="polite">
          {cargando ? <li className="vacia">cargando tareas...</li> : null}

          {!cargando && tareasFiltradas.length === 0 ? <li className="vacia">no hay tareas</li> : null}

          {!cargando
            ? tareasFiltradas.map((tarea) => (
                <li key={tarea.id} className={tarea.completada ? 'item completada' : 'item'}>
                  <label>
                    <input
                      type="checkbox"
                      checked={tarea.completada}
                      onChange={() => void alternarEstado(tarea.id, tarea.completada)}
                    />
                    <span>{tarea.titulo}</span>
                  </label>
                  <button
                    type="button"
                    className="eliminar"
                    onClick={() => void eliminarTarea(tarea.id)}
                  >
                    eliminar
                  </button>
                </li>
              ))
            : null}
        </ul>
      </section>
    </main>
  )
}

export default App
