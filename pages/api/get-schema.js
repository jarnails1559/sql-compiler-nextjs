import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tables = await executeQuery(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${process.env.DB_NAME}';
      `);

      const schema = {};

      for (const table of tables) {
        const columns = await executeQuery(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = '${process.env.DB_NAME}'
          AND table_name = '${table.table_name}';
        `);

        schema[table.table_name] = columns.map(col => ({
          name: col.column_name,
          type: col.data_type
        }));
      }

      res.status(200).json({ schema });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}