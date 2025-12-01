import fs from 'fs'
import https from 'https'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import publicRouter from './routes/public.js'
import { ensureDefaultUsers } from './db/initAdmin.js'
import usersRouter from './routes/users.js'
import authRouter from './routes/auth.js'
import { verifyToken } from './middleware/token-management.js'
import { requireAdmin } from './middleware/auth-admin.js'
import editeursRoutes from './routes/editeurs.js';
import personnesRoutes from './routes/personnes.js';
import jeuxRoutes from './routes/jeux.js';
import festivalsRoutes from './routes/festivals.js';
import reservationsRoutes from './routes/reservations.js';
import suiviRoutes from './routes/suivi.js';
import 'dotenv/config'

// Création de l’application Express
const app = express()
await ensureDefaultUsers()
// Ajout manuel des principaux en-têtes HTTP de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next();
})
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

// CORS: utilise la variable d'env si dispo, sinon le front Docker (8080)
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Routes
app.use('/api/public', publicRouter)
app.use('/api/auth', authRouter);
app.use('/api/users', verifyToken, usersRouter); // protégé
app.use('/api/admin', verifyToken, requireAdmin, (req, res) => {
  res.json({ message: 'Bienvenue admin' });
})

app.use('/api/editeurs', editeursRoutes);
app.use('/api/personnes', personnesRoutes);
app.use('/api/jeux', jeuxRoutes);
app.use('/api/festivals', festivalsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/suivi', suiviRoutes);

// Certificats (montés dans /app/certs via Docker)
const key = fs.readFileSync('./certs/localhost-key.pem')
const cert = fs.readFileSync('./certs/localhost.pem')

// Lancement du serveur HTTPS
https.createServer({ key, cert }, app).listen(4000, () => {
  console.log('👍 Serveur API démarré sur https://localhost:4000')
})