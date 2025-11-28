const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  getContacts: async () => {
    const res = await fetch(`${API_URL}/contacts`);
    return res.json();
  },
  createContact: async (contact) => {
    const res = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    return res.json();
  },
  deleteContact: async (id) => {
    await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
  },

  getAppointments: async () => {
    const res = await fetch(`${API_URL}/appointments`);
    return res.json();
  },
  createAppointment: async (appointment) => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    });
    return res.json();
  },
  deleteAppointment: async (id) => {
    await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
  },

  getTasks: async () => {
    const res = await fetch(`${API_URL}/tasks`);
    return res.json();
  },
  createTask: async (task) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },
  updateTask: async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  deleteTask: async (id) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // User Authentication
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  getUser: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`);
    return response.json();
  },

  updateUser: async (id, userData) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
};
