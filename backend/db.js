
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,              
  host: process.env.PGHOST,              
  database: process.env.PGDATABASE,       
  password: process.env.PGPASSWORD,     
  port: Number(process.env.PGPORT)       
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  } else {
    console.log("✅ PostgreSQL connected at:", res.rows[0].now);
  }
});

module.exports = pool;
