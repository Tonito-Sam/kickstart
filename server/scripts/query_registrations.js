const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    const [rows] = await pool.query('SELECT * FROM registrations ORDER BY id DESC LIMIT 5');
    console.log('Latest registrations:');
    console.table(rows);
  } catch (err) {
    console.error('Query failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) { }
  }
})();
