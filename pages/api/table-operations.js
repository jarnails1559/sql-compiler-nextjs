import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { tableName } = req.query;
    try {
      const tableDetails = await executeQuery(`SELECT * FROM ${tableName} LIMIT 10`);
      res.status(200).json({ tableDetails });
    } catch (err) {
      console.error('Error fetching table details:', err);
      res.status(500).json({ error: `Failed to fetch table details: ${err.message}` });
    }
  } else if (req.method === 'DELETE') {
    const { tableName } = req.query;
    try {
      await executeQuery(`DROP TABLE ${tableName}`);
      res.status(200).json({ message: `Table ${tableName} deleted successfully` });
    } catch (err) {
      console.error('Error deleting table:', err);
      res.status(500).json({ error: `Failed to delete table: ${err.message}` });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}