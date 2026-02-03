# Conectar Vercel Blob para las fotos del relevamiento

Las fotos que suben los usuarios (factura, techo, obstáculos, tablero) se guardan en **Vercel Blob** para que estén disponibles en la URL que se guarda en cada relevamiento.

## 1. Crear el Blob store en Vercel

1. Entrá a [Vercel Dashboard](https://vercel.com/dashboard) y abrí tu proyecto.
2. En el menú del proyecto, andá a **Storage**.
3. Clic en **Create Database** (o **Connect Store** si ya tenés otros).
4. Elegí **Blob** y poné un nombre (ej. `solar-relevamiento`).
5. Seleccioná el entorno (Production, Preview, Development) y creá el store.

Al crearlo, Vercel añade automáticamente la variable de entorno **`BLOB_READ_WRITE_TOKEN`** a tu proyecto. No tenés que copiarla a mano para producción o preview.

## 2. Desarrollo local

Para que la subida de fotos funcione en tu máquina:

```bash
# En la raíz del proyecto, con Vercel CLI instalado
vercel env pull .env.local
```

Eso descarga las variables de entorno del proyecto (incluido `BLOB_READ_WRITE_TOKEN`) a `.env.local`. Reiniciá el servidor de desarrollo (`npm run dev`) después de hacer pull.

Si no usás Vercel CLI, podés copiar el token a mano:

1. En Vercel Dashboard → tu proyecto → **Settings** → **Environment Variables**.
2. Buscá `BLOB_READ_WRITE_TOKEN` y mostrá el valor.
3. En tu proyecto local, en `.env.local`, añadí:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx...
   ```

## 3. Comportamiento

- **Con token configurado:** cada archivo subido se guarda en Blob con una ruta tipo `relevamiento/{timestamp}-{nombre}.ext` y la API devuelve la URL pública. Esa URL se guarda en `data/relevamientos.json` (o en tu base de datos) y el admin puede ver las fotos.
- **Sin token:** la API de upload responde con error 503 y un mensaje indicando que hay que configurar `BLOB_READ_WRITE_TOKEN`. El formulario no podrá completar el envío de fotos hasta que el token esté configurado.

## 4. Límites y costos

Consultá la [documentación de Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para límites del plan (almacenamiento, ancho de banda, etc.).
