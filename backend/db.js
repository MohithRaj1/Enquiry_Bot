import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'enquiry_bot.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ SQLite database connected successfully at:', dbPath);
  }
});

// Helper for running SQL with promises
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper for fetching single row
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper for fetching all rows
export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const initDb = async () => {
  try {
    // 1. Enquiries Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Chat Logs Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        user_query TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        source TEXT NOT NULL,
        latency_ms INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Knowledge Base Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        keywords TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL
      )
    `);

    // 4. Settings Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Seed default settings if not exists
    const colabUrlSetting = await dbGet(`SELECT * FROM settings WHERE key = 'colab_api_url'`);
    if (!colabUrlSetting) {
      await dbRun(`INSERT INTO settings (key, value) VALUES ('colab_api_url', '')`);
    }

    const aiModeSetting = await dbGet(`SELECT * FROM settings WHERE key = 'active_ai_mode'`);
    if (!aiModeSetting) {
      await dbRun(`INSERT INTO settings (key, value) VALUES ('active_ai_mode', 'hybrid')`);
    }

    // Seed Knowledge Base FAQs if empty
    const kbCount = await dbGet(`SELECT COUNT(*) as count FROM knowledge_base`);
    if (kbCount.count === 0) {
      console.log('🌱 Seeding Knowledge Base with default FAQs...');
      const defaultFAQs = [
        {
          topic: 'Admissions & Requirements',
          keywords: 'admission apply requirement eligibility deadline course join application',
          answer: 'Our admissions process is open year-round! You need a High School Diploma or equivalent degree, valid photo ID, and academic transcripts. Apply online via our admissions portal or ask our bot for course details.',
          category: 'Admissions'
        },
        {
          topic: 'Pricing & Fees Structure',
          keywords: 'price cost fee tuition payment scholarship discount installment',
          answer: 'Tuition fees vary by program (typically $1,200 - $4,500 per semester). We offer merit scholarships, flexible monthly payment plans, and financial aid support.',
          category: 'Finance'
        },
        {
          topic: 'Operating Hours & Contact',
          keywords: 'hour contact timing support office phone email address location',
          answer: 'Our support team is available Monday - Friday, 8:00 AM to 6:00 PM (EST). You can reach us at support@omniquery.ai or call +1 (800) 555-0199.',
          category: 'General'
        },
        {
          topic: 'Google Colab Integration Instructions',
          keywords: 'colab integration python api connect ngrok notebook server setup model',
          answer: 'To connect Google Colab: 1. Open colab/colab_enquiry_bot.ipynb in Google Colab. 2. Run all cells to launch the FastAPI + Ngrok server. 3. Copy the generated HTTPS Ngrok URL and paste it in the "Colab Settings" tab!',
          category: 'Tech Support'
        },
        {
          topic: 'Courses & Certification',
          keywords: 'course diploma degree certificate program online offline learn skills',
          answer: 'We offer specialized industry-aligned programs in AI Engineering, Data Science, Full-Stack Development, and Cloud Architecture with hands-on projects and recognized certification.',
          category: 'Academic'
        }
      ];

      for (const faq of defaultFAQs) {
        await dbRun(
          `INSERT INTO knowledge_base (topic, keywords, answer, category) VALUES (?, ?, ?, ?)`,
          [faq.topic, faq.keywords, faq.answer, faq.category]
        );
      }

      // Seed dummy sample enquiries for admin view
      const sampleEnquiries = [
        {
          name: 'Alex Johnson',
          email: 'alex.johnson@example.com',
          phone: '+1 (555) 234-5678',
          category: 'Admissions',
          subject: 'Inquiry about AI Engineering Masters',
          message: 'Hi, I would like to know the prerequisites for the AI Masters starting next month.',
          status: 'pending',
          priority: 'high'
        },
        {
          name: 'Sarah Connor',
          email: 'sarah.c@example.com',
          phone: '+1 (555) 987-6543',
          category: 'Finance',
          subject: 'Scholarship application details',
          message: 'Can you provide the application form and eligibility criteria for merit scholarships?',
          status: 'in_progress',
          priority: 'medium'
        },
        {
          name: 'David Miller',
          email: 'david.m@example.com',
          phone: '+1 (555) 345-6789',
          category: 'Tech Support',
          subject: 'Colab API connection help',
          message: 'I ran the Colab notebook but ngrok gave a 404 error. Please assist.',
          status: 'resolved',
          priority: 'low'
        }
      ];

      for (const enq of sampleEnquiries) {
        await dbRun(
          `INSERT INTO enquiries (name, email, phone, category, subject, message, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [enq.name, enq.email, enq.phone, enq.category, enq.subject, enq.message, enq.status, enq.priority]
        );
      }
    }

    console.log('✅ SQLite database schema initialized & seeded.');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
};

export default db;
