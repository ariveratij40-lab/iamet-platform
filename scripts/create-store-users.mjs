import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS store_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(256) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      phone VARCHAR(32),
      company VARCHAR(256),
      emailVerified TINYINT(1) DEFAULT 0 NOT NULL,
      verificationToken VARCHAR(128),
      tokenExpiry DATETIME,
      resetToken VARCHAR(128),
      resetTokenExpiry DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log("✅ Tabla store_users creada (o ya existía)");

  await conn.execute(`
    ALTER TABLE quote_requests 
    ADD COLUMN IF NOT EXISTS storeUserId INT NULL
  `);
  console.log("✅ Columna storeUserId agregada a quote_requests");

  await conn.execute(`
    ALTER TABLE saved_carts 
    ADD COLUMN IF NOT EXISTS storeUserId INT NULL UNIQUE
  `);
  console.log("✅ Columna storeUserId agregada a saved_carts");

} catch (err) {
  console.error("Error:", err.message);
} finally {
  await conn.end();
}
