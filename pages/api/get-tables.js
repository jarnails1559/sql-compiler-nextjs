import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tables = await executeQuery(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${process.env.DB_NAME || 'sql12729087'}';
      `);

      res.status(200).json({ tables: tables.map(t => t.table_name) });
    } catch (err) {
      console.error('Error fetching tables:', err);
      res.status(500).json({ error: `Failed to fetch tables: ${err.message}` });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}