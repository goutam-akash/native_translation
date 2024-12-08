import pkg from "pg";
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  user: "my_postgres_dqrl_user",
  host: "dpg-ct6kl1dumphs739h8ga0-a.oregon-postgres.render.com",
  database: "my_postgres_dqrl",
  password: "kVesnrcNJAslyzXoCfUdess3b6OJ74cm",
  port: 5432,
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // wait for a maximum of 5 seconds for a connection
  ssl: {
    rejectUnauthorized: false, // Allows self-signed certificates
  },
});

export default pool;
