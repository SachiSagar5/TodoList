export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://taskmaster-api.onrender.com' : 'http://localhost:3001');
