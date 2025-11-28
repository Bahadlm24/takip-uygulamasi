const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./services/JsonDbService');
const whatsapp = require('./services/WhatsappService');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api/contacts', async (req, res) => {
    const contacts = await db.read('contacts');
    res.json(contacts);
});

app.post('/api/contacts', async (req, res) => {
    const contact = await db.add('contacts', req.body);
    res.json(contact);
});

app.delete('/api/contacts/:id', async (req, res) => {
    await db.delete('contacts', req.params.id);
    res.json({ success: true });
});

app.get('/api/appointments', async (req, res) => {
    const appointments = await db.read('appointments');
    res.json(appointments);
});

app.post('/api/appointments', async (req, res) => {
    const appointment = await db.add('appointments', req.body);
    
    // Send WhatsApp notification if phone number is provided
    if (appointment.contactPhone) {
        const message = `Sayın ${appointment.contactName}, ${appointment.date} tarihli randevunuz oluşturulmuştur.`;
        whatsapp.sendMessage(appointment.contactPhone, message);
    }

    res.json(appointment);
});

app.delete('/api/appointments/:id', async (req, res) => {
    await db.delete('appointments', req.params.id);
    res.json({ success: true });
});

app.get('/api/tasks', async (req, res) => {
    const tasks = await db.read('tasks');
    res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
    const task = await db.add('tasks', req.body);
    res.json(task);
});

app.put('/api/tasks/:id', async (req, res) => {
    const task = await db.update('tasks', req.params.id, req.body);
    res.json(task);
});

app.delete('/api/tasks/:id', async (req, res) => {
    await db.delete('tasks', req.params.id);
    res.json({ success: true });
});

// User Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await db.read('users');
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } else {
        res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, name, email, phone } = req.body;
    const users = await db.read('users');
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    
    const newUser = await db.add('users', {
        username,
        password,
        name,
        email,
        phone,
        createdAt: new Date().toISOString()
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword });
});

app.get('/api/users/:id', async (req, res) => {
    const users = await db.read('users');
    const user = users.find(u => u.id === req.params.id);
    
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, phone, password } = req.body;
    const updateData = { name, email, phone };
    
    // Only update password if provided
    if (password) {
        updateData.password = password;
    }
    
    const updatedUser = await db.update('users', req.params.id, updateData);
    
    if (updatedUser) {
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ success: true, user: userWithoutPassword });
    } else {
        res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
