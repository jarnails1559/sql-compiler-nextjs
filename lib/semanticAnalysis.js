import { format } from 'sql-formatter';

export function analyzeQuery(query) {
  try {
    // Format the SQL query to check for syntax errors
    format(query);

    // Perform additional semantic analysis if needed
    const errors = [];

    // Example: Check for undeclared variables (tables)
    // Note: This is a simplified example and may need to be adjusted for your use case
    const declaredTables = new Set();
    const usedTables = new Set();

    const tableRegex = /FROM\s+(\w+)/gi;
    let match;
    while ((match = tableRegex.exec(query)) !== null) {
      usedTables.add(match[1]);
    }

    usedTables.forEach((table) => {
      if (!declaredTables.has(table)) {
        errors.push(`Undeclared table: ${table}`);
      }
    });

    return errors;
  } catch (err) {
    return [`Syntax error: ${err.message}`];
  }
}