"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Save, Download, Database, Clock, Clipboard, BarChart2, List, X, Settings, Check } from 'react-feather';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import Chart from 'chart.js/auto';

const SQLCompiler: React.FC = () => {
  const [query, setQuery] = useState<string>('SELECT 1');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showSchema, setShowSchema] = useState<boolean>(false);
  const [schema, setSchema] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [showTables, setShowTables] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<any[] | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [config, setConfig] = useState({
    host: "sql12.freesqldatabase.com",
    user: "sql12729087",
    password: "8tq2csXBcq",
    database: "sql12729087",
    port: "3306",
  });
  const [testingConfig, setTestingConfig] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    const savedHistory = localStorage.getItem('queryHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('queryHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setClearMessage(null);
    setLoading(true);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);

      if (res.ok) {
        setResult(data.results);
        setNotification('Code executed successfully.');
        setHistory(prev => [query, ...prev.slice(0, 9)]);
        if (Array.isArray(data.results) && data.results.length > 0 && Array.isArray(data.results[0])) {
          createChart(data.results[0]);
        }
      } else {
        setError(data.error);
        setNotification(`Error occurred: ${data.error}`);
      }
    } catch (err) {
      setError(err.message);
      setNotification(`Error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setResult(null);
    setClearMessage(null);
    setClearing(true);

    try {
      const res = await fetch('/api/clear-database', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setClearMessage(data.message);
        setNotification('Database has been completely reset.');
        // Clear the query history as well
        setHistory([]);
        localStorage.removeItem('queryHistory');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      setNotification(`Error occurred: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleExport = () => {
    if (result) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "query_result.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/get-schema');
      const data = await res.json();
      if (res.ok) {
        setSchema(data.schema);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/get-tables');
      const data = await res.json();
      if (res.ok) {
        setTables(data.tables);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderSingleResult = (data: any) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // This is likely a table result
      const headers = Object.keys(data[0]);
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                  {headers.map((header) => (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {row[header] !== null ? row[header].toString() : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (typeof data === 'object') {
      // This is likely a single row or metadata
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      );
    } else {
      // This is likely a scalar value
      return <p className="text-gray-700 dark:text-gray-300">{data}</p>;
    }
  };

  const renderResult = (data: any) => {
    if (!data) return <p className="text-gray-700 dark:text-gray-300">No results returned.</p>;

    if (Array.isArray(data)) {
      if (data.length === 0) return <p className="text-gray-700 dark:text-gray-300">No results returned.</p>;

      return (
        <div>
          {data.map((result, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Result {index + 1}</h3>
              {renderSingleResult(result)}
            </div>
          ))}
        </div>
      );
    } else {
      return renderSingleResult(data);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('queryHistory');
    setNotification('Query history cleared.');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setNotification('Result copied to clipboard');
  };

  const createChart = (data: any[]) => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map(item => Object.values(item)[0]),
            datasets: [{
              label: 'Query Result',
              data: data.map(item => Object.values(item)[1]),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    try {
      const res = await fetch(`/api/table-operations?tableName=${tableName}`);
      const data = await res.json();
      if (res.ok) {
        setTableDetails(data.tableDetails || []); // Ensure tableDetails is always an array
        setSelectedTable(tableName);
        setShowModal(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (window.confirm(`Are you sure you want to delete the table "${tableName}"?`)) {
      try {
        const res = await fetch(`/api/table-operations?tableName=${tableName}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          setNotification(data.message);
          setShowModal(false);
          fetchTables(); // Refresh the table list
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin' && password === 'Jaxs123') {
      setShowSettings(false);
      setShowConfig(true);
    } else {
      setNotification('Invalid credentials');
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleConfigSave = async () => {
    try {
      const res = await fetch('/api/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setNotification('Configuration updated successfully');
        setShowConfig(false);
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfigTest = async () => {
    setTestingConfig(true);
    try {
      const res = await fetch('/api/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification('Credentials are valid');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(`Credentials are invalid: ${err.message}`);
    } finally {
      setTestingConfig(false);
    }
  };

  return (
    <div className={`container mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">SQL Compiler</h1>
        <div className="flex space-x-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-700" />}
          </button>
          <button onClick={handleExport} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <Download className="text-gray-700 dark:text-gray-300" />
          </button>
          <button onClick={() => { setShowSchema(!showSchema); fetchSchema(); }} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <Database className="text-gray-700 dark:text-gray-300" />
          </button>
          <button onClick={() => { setShowTables(!showTables); fetchTables(); }} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <List className="text-gray-700 dark:text-gray-300" />
          </button>
          <button onClick={handleSettingsClick} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <Settings className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4">
            <form onSubmit={handleSubmit}>
              <div className="w-full h-64">
                <CodeMirror
                  value={query}
                  height="100%"
                  width="100%"
                  extensions={[sql()]}
                  onChange={(value) => setQuery(value)}
                  theme={darkMode ? vscodeDark : undefined}
                  minHeight="200px"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-lg shadow-md transition duration-300 ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  disabled={loading}
                >
                  {loading ? 'Executing...' : 'Execute'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className={`px-6 py-3 rounded-lg shadow-md transition duration-300 ${clearing ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  disabled={clearing}
                >
                  {clearing ? 'Resetting...' : 'Force Reset DB'}
                </button>
              </div>
            </form>
          </div>
          {executionTime && (
            <div className="mb-4 flex items-center">
              <Clock className="mr-2" />
              <span>Execution time: {executionTime.toFixed(2)} ms</span>
            </div>
          )}
          {result && (
            <div className="mb-4">
              <button
                onClick={handleCopyToClipboard}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 flex items-center"
              >
                <Clipboard className="mr-2" /> Copy to Clipboard
              </button>
            </div>
          )}
          {result ? renderResult(result) : <p className="text-gray-700 dark:text-gray-300">No results to display.</p>}
          {Array.isArray(result) && result.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Result Visualization</h3>
              <canvas ref={chartRef}></canvas>
            </div>
          )}
        </div>
        <div>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Query History</h2>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
              >
                Clear History
              </button>
            </div>
            <ul className="space-y-2">
              {history.map((q, index) => (
                <li key={index} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded" onClick={() => setQuery(q)}>
                  {q.length > 50 ? q.substring(0, 50) + '...' : q}
                </li>
              ))}
            </ul>
          </div>
          {showSchema && schema && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Database Schema</h2>
              <pre className="text-sm overflow-x-auto">
                <code>{JSON.stringify(schema, null, 2)}</code>
              </pre>
            </div>
          )}
          {showTables && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Existing Tables</h2>
              {tables.length > 0 ? (
                <ul className="list-disc pl-5">
                  {tables.map((table, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 cursor-pointer hover:underline" onClick={() => fetchTableDetails(table)}>
                      {table}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">No tables found in the database.</p>
              )}
            </div>
          )}
        </div>
      </div>
      {showModal && selectedTable && tableDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{selectedTable}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X />
              </button>
            </div>
            {tableDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {Object.keys(tableDetails[0]).map((header) => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tableDetails.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {value !== null && value !== undefined ? value.toString() : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">This table is empty.</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDeleteTable(selectedTable)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
              >
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
              />
              <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">Login</button>
            </form>
          </div>
        </div>
      )}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">SQL Server Configuration</h2>
            <input
              type="text"
              name="host"
              placeholder="Host"
              value={config.host}
              onChange={handleConfigChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="user"
              placeholder="User"
              value={config.user}
              onChange={handleConfigChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={config.password}
              onChange={handleConfigChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="database"
              placeholder="Database"
              value={config.database}
              onChange={handleConfigChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="port"
              placeholder="Port"
              value={config.port}
              onChange={handleConfigChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="flex justify-between">
              <button onClick={handleConfigSave} className="p-2 bg-blue-500 text-white rounded">Save</button>
              <button 
                onClick={handleConfigTest} 
                className={`p-2 ${testingConfig ? 'bg-gray-500' : 'bg-green-500'} text-white rounded`}
                disabled={testingConfig}
              >
                {testingConfig ? 'Testing...' : 'Test'}
              </button>
              <button onClick={() => setShowConfig(false)} className="p-2 bg-red-500 text-white rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-md ${error ? 'bg-red-500 text-white' : 'bg-green-500 text-white'} transition-opacity duration-300`}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default SQLCompiler;