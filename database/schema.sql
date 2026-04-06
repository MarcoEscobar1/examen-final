BEGIN;

CREATE TABLE IF NOT EXISTS tareas (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    completada BOOLEAN NOT NULL DEFAULT FALSE,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tareas_titulo_no_vacio CHECK (btrim(titulo) <> '')
);

CREATE INDEX IF NOT EXISTS idx_tareas_completada ON tareas (completada);
CREATE INDEX IF NOT EXISTS idx_tareas_creada_en_desc ON tareas (creada_en DESC);

CREATE OR REPLACE FUNCTION establecer_tareas_actualizada_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizada_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tareas_establecer_actualizada_en ON tareas;

CREATE TRIGGER trg_tareas_establecer_actualizada_en
BEFORE UPDATE ON tareas
FOR EACH ROW
EXECUTE FUNCTION establecer_tareas_actualizada_en();

COMMIT;