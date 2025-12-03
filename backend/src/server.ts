import fs from 'fs';
import https from 'https';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import du middleware d'authentification
import { verifyToken } from './middleware/token-management.js';

// Import des routes
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import usersRoutes from './routes/users.js';
import editeursRoutes from './routes/editeurs.js';
import festivalsRoutes from './routes/festivals.js';
import reservationsRoutes from './routes/reservations.js';
import jeuxRoutes from './routes/jeux.js';
import suiviRoutes from './routes/suivi.js';
import personnesRoutes from './routes/personnes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Ajout manuel des principaux en-têtes HTTP de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Middlewares globaux
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// CORS: utilise la variable d'env si dispo, sinon le front par défaut
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes publiques (pas de protection)
app.use('/api/auth', authRoutes);
app. use('/api/public', publicRoutes);

// PROTECTION GLOBALE : Toutes les routes métier nécessitent un token valide
app.use('/api/users', verifyToken, usersRoutes);
app. use('/api/editeurs', verifyToken, editeursRoutes);
app.use('/api/festivals', verifyToken, festivalsRoutes);
app.use('/api/reservations', verifyToken, reservationsRoutes);
app.use('/api/jeux', verifyToken, jeuxRoutes);
app.use('/api/suivi', verifyToken, suiviRoutes);
app.use('/api/personnes', verifyToken, personnesRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Tentative de démarrage en HTTPS, fallback en HTTP si certificats non disponibles
try {
  const key = fs.readFileSync('./certs/localhost-key.pem');
  const cert = fs. readFileSync('./certs/localhost.pem');
  
  https.createServer({ key, cert }, app).listen(PORT, () => {
    console. log(`👍 Serveur API démarré sur https://localhost:${PORT}`);
  });
} catch (error) {
  console. log('⚠️ Certificats HTTPS non trouvés, démarrage en HTTP');
  app.listen(PORT, () => {
    console. log(`Server running on http://localhost:${PORT}`);
  });
}