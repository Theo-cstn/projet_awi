import express from 'express';
import cors from 'cors';
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
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes publiques (pas de protection)
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

// PROTECTION GLOBALE : Toutes les routes métier nécessitent un token valide
app.use('/api/users', verifyToken, usersRoutes);
app.use('/api/editeurs', verifyToken, editeursRoutes);
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
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});