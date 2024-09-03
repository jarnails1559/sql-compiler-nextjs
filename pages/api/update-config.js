import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const config = req.body;
    const configPath = path.join(process.cwd(), 'lib', 'db.js');
    
    const configContent = `
import mysql from 'mysql2/promise';

const config = ${JSON.stringify(config, null, 2)};

export async function executeQuery(query) {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [result] = await connection.execute(query);
    return result;
  } catch (err) {
    throw new Error(\`Database error: \${err.message}\`);
  } finally {
    if (connection) await connection.end();
  }
}
`;

    fs.writeFileSync(configPath, configContent);
    res.status(200).json({ message: 'Configuration updated successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}