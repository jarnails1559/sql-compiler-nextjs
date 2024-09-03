
import mysql from 'mysql2/promise';

const config = {
  "host": "sql12.freesqldatabase.com",
  "user": "sql12729087",
  "password": "8tq2csXBcq",
  "database": "sql12729087",
  "port": "3306"
};

export async function executeQuery(query) {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [result] = await connection.execute(query);
    return result;
  } catch (err) {
    throw new Error(`Database error: ${err.message}`);
  } finally {
    if (connection) await connection.end();
  }
}
