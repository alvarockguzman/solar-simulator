# Copia de respaldo — Presupuesto / Relevamiento

Snapshot de la aplicación **Presupuesto Indicativo** (antes *relevamiento*), guardada antes de modificarla o eliminarla.

**Fecha del respaldo:** mayo 2026  
**Rutas en producción al momento del backup:** `/presupuesto`, `/presupuesto/wizard`, `/presupuesto/admin`, API `/api/presupuesto/*`

## Contenido

| Carpeta / archivo | Origen en el proyecto activo |
|-------------------|------------------------------|
| `app-presupuesto/` | `app/presupuesto/` |
| `api-presupuesto/` | `app/api/presupuesto/` |
| `data-relevamientos.json` | `data/relevamientos.json` (datos de ejemplo / pruebas) |

Esta carpeta **no se ejecuta** como app (está fuera de `app/`). Es solo referencia y copia de archivos.

## Restaurar desde Git (recomendado)

Rama con el proyecto completo tal como estaba:

```bash
git fetch origin
git checkout archive/relevamiento
```

Para traer solo la app de vuelta a `main`:

```bash
git checkout main
git checkout archive/relevamiento -- app/presupuesto app/api/presupuesto
```

## Restaurar desde esta carpeta

Copiá manualmente:

- `archive/relevamiento/app-presupuesto/` → `app/presupuesto/`
- `archive/relevamiento/api-presupuesto/` → `app/api/presupuesto/`

Revisá imports y rutas (`/presupuesto`, `/api/presupuesto`) después de restaurar.
