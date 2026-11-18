require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const winston = require('winston');
const crypto = require('crypto');
const { format } = require('@fast-csv/format');
const PDFDocument = require('pdfkit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}

// Setup Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/security.log' })
  ]
});

// Setup Swagger UI Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Registration & Check-in API Documentation',
      version: '1.0.0',
      description: 'API endpoints for managing events, guest registrations, check-ins, and automated reports.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Setup SQLite Database
const db = new sqlite3.Database(process.env.DB_PATH || './database.sqlite', (err) => {
  if (err) {
    logger.error('Database opening error: ' + err.message);
  } else {
    logger.info('Connected to SQLite database.');
  }
});

// Initialize Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`, (err) => {
    if (err) {
      logger.error('Error creating users table: ' + err.message);
      return;
    }
    // Seed default admin only AFTER the users table is guaranteed to exist
    db.get(`SELECT * FROM users WHERE username = 'admin'`, (selectErr, row) => {
      if (!row) {
        const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
          ['admin', hashedAdminPassword, 'admin']);
        logger.info('Default admin user created.');
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    venue_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    event_id INTEGER,
    email TEXT,
    checked_in INTEGER DEFAULT 0,
    UNIQUE(event_id, email),
    FOREIGN KEY(event_id) REFERENCES events(id)
  )`);
});

// Middleware: Verify JWT
const verifyJWT = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) return res.status(401).json({ error: 'No token provided' });

  const token = tokenHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
};

// Middleware: Verify Admin Role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }
  next();
};

// --- AUTH ROUTES ---
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and obtain JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with JWT token returned
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
    logger.info(`Successful login: ${username} (${user.role})`);
    res.json({ token, role: user.role, username: user.username });
  });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user account (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Admin permission required
 */
app.post('/api/users', verifyJWT, verifyAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, role],
    function (err) {
      if (err) {
        logger.error('Error creating user: ' + err.message);
        return res.status(400).json({ error: 'Username already exists or invalid data' });
      }
      logger.info(`Admin ${req.user.username} created new user: ${username} (${role})`);
      res.status(201).json({ message: 'User created successfully', userId: this.lastID });
    }
  );
});

// --- EVENT ROUTES ---
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Retrieve all events
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of events returned successfully
 */
app.get('/api/events', verifyJWT, (req, res) => {
  db.all(`SELECT * FROM events`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch events' });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               venue_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created successfully
 */
app.post('/api/events', verifyJWT, verifyAdmin, (req, res) => {
  const { title, date, venue_id } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });

  db.run(
    `INSERT INTO events (title, date, venue_id) VALUES (?, ?, ?)`,
    [title, date, venue_id || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create event' });
      logger.info(`Admin ${req.user.username} created event ID ${this.lastID}: ${title}`);
      res.status(201).json({ message: 'Event created successfully', eventId: this.lastID });
    }
  );
});

// --- REGISTRATION & CHECK-IN ROUTES ---
app.post('/api/events/:id/register', verifyJWT, (req, res) => {
  const eventId = req.params.id;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Guest email is required' });

  const uniqueId = 'GUEST-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  db.run(
    `INSERT INTO registrations (id, event_id, email, checked_in) VALUES (?, ?, ?, 0)`,
    [uniqueId, eventId, email],
    function (err) {
      if (err) return res.status(400).json({ error: 'Email is already registered for this event' });
      logger.info(`User ${req.user.username} registered guest ${email} for event ${eventId} with ID ${uniqueId}`);
      res.status(201).json({ uniqueId, message: 'Guest registered successfully' });
    }
  );
});

app.get('/api/events/:id/guests', verifyJWT, (req, res) => {
  const eventId = req.params.id;
  db.all(`SELECT * FROM registrations WHERE event_id = ?`, [eventId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch guest list' });
    res.json(rows);
  });
});

app.post('/api/events/:id/verify-checkin', verifyJWT, (req, res) => {
  const eventId = req.params.id;
  const { email, uniqueId } = req.body;

  if (!email || !uniqueId) {
    return res.status(400).json({ error: 'Email and Unique ID are required' });
  }

  db.get(
    `SELECT * FROM registrations WHERE event_id = ? AND email = ?`,
    [eventId, email.trim().toLowerCase()],
    (err, guest) => {
      if (err || !guest) return res.status(404).json({ error: 'Guest email not found for this event' });
      if (guest.id !== uniqueId.trim()) return res.status(400).json({ error: 'Unique ID does not match this guest' });
      if (guest.checked_in === 1) return res.status(400).json({ error: 'Guest is already checked in' });

      db.run(`UPDATE registrations SET checked_in = 1 WHERE id = ?`, [guest.id], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to update check-in status' });
        logger.info(`User ${req.user.username} successfully checked in guest ${email} (ID: ${guest.id})`);
        res.json({ message: 'Guest checked in successfully!' });
      });
    }
  );
});

// --- REPORTING MODULE ROUTES ---
app.get('/api/reports/csv', verifyJWT, verifyAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=event_report.csv');

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  db.all(
    `SELECT r.id AS registration_id, e.title AS event_title, r.email, r.checked_in, e.date 
     FROM registrations r 
     JOIN events e ON r.event_id = e.id`,
    [],
    (err, rows) => {
      if (err) {
        logger.error('Error generating CSV report: ' + err.message);
        return res.status(500).json({ error: 'Failed to generate CSV report' });
      }

      rows.forEach((row) => {
        csvStream.write({
          'Registration ID': row.registration_id,
          'Event Title': row.event_title,
          'Guest Email': row.email,
          'Status': row.checked_in === 1 ? 'Checked In' : 'Pending',
          'Event Date': row.date
        });
      });
      csvStream.end();
      logger.info(`Admin ${req.user.username} downloaded CSV report.`);
    }
  );
});

app.get('/api/reports/pdf', verifyJWT, verifyAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=monthly_summary.pdf');

  const doc = new PDFDocument();
  doc.pipe(res);

  doc.fontSize(20).text('Event Management System', { align: 'center' });
  doc.fontSize(14).text('Monthly Attendance & Activity Summary Report', { align: 'center' });
  doc.moveDown(2);

  db.get(`SELECT COUNT(*) as totalEvents FROM events`, [], (err, eventStats) => {
    db.get(`SELECT COUNT(*) as totalRegs, SUM(checked_in) as totalCheckedIn FROM registrations`, [], (regErr, regStats) => {
      doc.fontSize(12).text(`Total Events Created: ${eventStats?.totalEvents || 0}`);
      doc.text(`Total Guests Registered: ${regStats?.totalRegs || 0}`);
      doc.text(`Total Guests Checked In: ${regStats?.totalCheckedIn || 0}`);
      doc.moveDown(2);
      doc.text('Generated securely via Full-Stack Event System Audit Engine.', { fontSize: 10 });
      
      doc.end();
      logger.info(`Admin ${req.user.username} downloaded Monthly PDF report.`);
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});