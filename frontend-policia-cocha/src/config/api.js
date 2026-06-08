// Fuente única de la URL base del backend.
// Dev: Vite proxy redirige /api → backend (PORT en backend/.env, default 3001).
// Prod: definir VITE_API_BASE=http://servidor:3001/api en .env del frontend.
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};