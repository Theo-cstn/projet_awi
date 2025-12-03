import pool from './database.js'
import bcrypt from 'bcryptjs'

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

  console.log('👍 Utilisateurs Tom (admin) et Théo (visiteur) vérifiés ou créés');
}