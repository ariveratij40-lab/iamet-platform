import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL!;
const pool = await mysql.createPool(url);

try {
  await pool.execute(`CREATE TABLE IF NOT EXISTS saved_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    items JSON NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY saved_carts_userId_unique (userId)
  )`);
  console.log("✅ saved_carts created");

  // TiDB supports IF NOT EXISTS for ADD COLUMN
  try {
    await pool.execute(`ALTER TABLE quote_requests ADD COLUMN userId INT`);
    console.log("✅ userId added to quote_requests");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️  userId already exists in quote_requests");
    } else {
      throw e;
    }
  }
} catch (e: any) {
  console.error("❌", e.message);
} finally {
  await pool.end();
}
