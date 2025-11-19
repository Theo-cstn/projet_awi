import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        'postgres://festival_app:festival_app@localhost:5432/festival_app',
})

export default pool