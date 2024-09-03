import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;

    try {
      // Split the query into individual statements
      const statements = query.split(';').filter(stmt => stmt.trim() !== '');
      const results = [];

      // Execute each statement sequentially
      for (const statement of statements) {
        console.log('Executing statement:', statement);
        const result = await executeQuery(statement.trim());
        results.push(result);
        console.log('Statement result:', result);
      }

      res.status(200).json({ results });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: error.message || 'An unknown error occurred' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}