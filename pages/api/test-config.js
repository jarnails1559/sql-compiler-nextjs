import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const config = req.body;
    let connection;

    try {
      // Add a slight delay to make the loading state more noticeable
      await new Promise(resolve => setTimeout(resolve, 1000));

      connection = await mysql.createConnection(config);
      await connection.execute('SELECT 1');
      res.status(200).json({ message: 'Configuration test successful' });
    } catch (err) {
      res.status(500).json({ error: `Configuration test failed: ${err.message}` });
    } finally {
      if (connection) await connection.end();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}