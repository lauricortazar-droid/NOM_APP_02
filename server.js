// Punto de entrada compatible con el modo Express de Hostinger.
// La interfaz sigue siendo una demo React/Vite construida en dist/.
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const index = join(dist, 'index.html');

if (!existsSync(index)) {
  console.error('No se encontró dist/index.html. Ejecuta npm run build antes de iniciar.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.static(dist, { index: 'index.html', maxAge: '1h' }));

// Permite volver a cargar rutas SPA sin enviar index.html para assets inexistentes.
app.get('*', (req, res) => {
  if (req.path.startsWith('/assets/') || !req.accepts('html')) {
    return res.sendStatus(404);
  }
  return res.sendFile(index);
});

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT inválido.');
  process.exit(1);
}
app.listen(port, '0.0.0.0', () => {
  console.log('CentroVida DEMO disponible en puerto ' + port);
});
