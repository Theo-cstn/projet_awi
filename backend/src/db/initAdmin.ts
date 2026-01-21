import pool from './database.js';
import bcrypt from 'bcryptjs';

export async function ensureDefaultUsers() {
  // Tom (admin)
  const hashTom = await bcrypt.hash('password', 10);
  await pool.query(
    `INSERT INTO users (login, password_hash, role)
     VALUES ('Tom', $1, 'admin')
     ON CONFLICT (login) DO NOTHING`,
    [hashTom]
  );

  // Théo (visiteur)
  const hashTheo = await bcrypt.hash('password', 10);
  await pool.query(
    `INSERT INTO users (login, password_hash, role)
     VALUES ('Theo', $1, 'visiteur')
     ON CONFLICT (login) DO NOTHING`,
    [hashTheo]
  );

  // Amina (organisateur_jeux)
  const hashAmina = await bcrypt.hash('password', 10);
  await pool.query(
    `INSERT INTO users (login, password_hash, role)
     VALUES ('Amina', $1, 'organisateur_jeux')
     ON CONFLICT (login) DO NOTHING`,
    [hashAmina]
  );

  // Julien (organisateur_reservations)
  const hashJulien = await bcrypt.hash('password', 10);
  await pool.query(
    `INSERT INTO users (login, password_hash, role)
     VALUES ('Julien', $1, 'organisateur_reservations')
     ON CONFLICT (login) DO NOTHING`,
    [hashJulien]
  );

  // Sarah (no-role)
  const hashSarah = await bcrypt.hash('password', 10);
  await pool.query(
    `INSERT INTO users (login, password_hash, role)
     VALUES ('Sarah', $1, 'no-role')
     ON CONFLICT (login) DO NOTHING`,
    [hashSarah]
  );

  console.log('👍 Utilisateurs par rôle vérifiés ou créés : Tom, Théo, Amina, Julien, Sarah');
}