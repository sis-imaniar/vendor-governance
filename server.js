import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || 8080)
const apiTarget = process.env.API_PROXY_TARGET

const app = express()

// Same-origin /api → verificatorapi (no browser CORS)
app.use(
  '/api',
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    secure: true,
  }),
)

app.use(express.static(distDir))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`Verificator app listening on :${port} (API proxy → ${apiTarget})`)
})
