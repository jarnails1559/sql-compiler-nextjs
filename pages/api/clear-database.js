import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get a list of all tables in the database
      const tables = await executeQuery(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${process.env.DB_NAME || 'sql12729087'}';
      `);

      // Drop tables one by one
      for (const table of tables) {
        await executeQuery(`DROP TABLE IF EXISTS \`${table.table_name}\`;`);
      }

      res.status(200).json({ message: 'Database has been completely reset.' });
    } catch (err) {
      console.error('Error resetting database:', err);
      res.status(500).json({ error: `Failed to reset database: ${err.message}` });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}