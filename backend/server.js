import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { dbRun, dbGet, dbAll, initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
await initDb();

// ----------------------------------------------------
// 1. COLAB CONFIGURATION & STATUS ENDPOINTS
// ----------------------------------------------------

// Get Colab API Config
app.get('/api/colab/config', async (req, res) => {
  try {
    const urlSetting = await dbGet(`SELECT value FROM settings WHERE key = 'colab_api_url'`);
    const modeSetting = await dbGet(`SELECT value FROM settings WHERE key = 'active_ai_mode'`);

    res.json({
      success: true,
      colabUrl: urlSetting ? urlSetting.value : '',
      activeMode: modeSetting ? modeSetting.value : 'hybrid',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Colab API Config
app.post('/api/colab/config', async (req, res) => {
  try {
    const { colabUrl, activeMode } = req.body;
    
    // Clean trailing slash
    const cleanedUrl = colabUrl ? colabUrl.trim().replace(/\/$/, '') : '';

    await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES ('colab_api_url', ?)`, [cleanedUrl]);
    if (activeMode) {
      await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES ('active_ai_mode', ?)`, [activeMode]);
    }

    res.json({
      success: true,
      message: 'Colab API configuration updated in SQLite',
      colabUrl: cleanedUrl,
      activeMode: activeMode || 'hybrid',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Ping Connection to Google Colab Endpoint
app.get('/api/colab/status', async (req, res) => {
  try {
    const urlSetting = await dbGet(`SELECT value FROM settings WHERE key = 'colab_api_url'`);
    const colabUrl = urlSetting ? urlSetting.value : '';

    if (!colabUrl) {
      return res.json({
        online: false,
        message: 'No Colab API URL configured in SQLite settings.',
      });
    }

    const startTime = Date.now();
    let colabResponse = null;

    try {
      // Try /health or / ping endpoint first
      colabResponse = await axios.get(`${colabUrl}/health`, { timeout: 4000 });
    } catch {
      // Fallback try root endpoint
      try {
        colabResponse = await axios.get(colabUrl, { timeout: 4000 });
      } catch (e) {
        return res.json({
          online: false,
          message: `Colab connection failed: ${e.message}`,
          colabUrl,
        });
      }
    }

    const latency = Date.now() - startTime;
    res.json({
      online: true,
      latency,
      message: 'Connected to Colab API',
      colabUrl,
      serverDetails: colabResponse.data || {},
    });
  } catch (err) {
    res.status(500).json({ online: false, error: err.message });
  }
});

// ----------------------------------------------------
// 2. CHAT & INTELLIGENT ROUTER ENDPOINT
// ----------------------------------------------------

app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { query, sessionId } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: 'Query parameter is required.' });
  }

  const userQuery = query.trim();
  let botResponse = '';
  let responseSource = 'sqlite_kb';

  try {
    const urlSetting = await dbGet(`SELECT value FROM settings WHERE key = 'colab_api_url'`);
    const modeSetting = await dbGet(`SELECT value FROM settings WHERE key = 'active_ai_mode'`);

    const colabUrl = urlSetting ? urlSetting.value : '';
    const activeMode = modeSetting ? modeSetting.value : 'hybrid';

    let colabSuccess = false;

    // Try Colab API if URL is provided and mode allows it
    if (colabUrl && (activeMode === 'colab' || activeMode === 'hybrid')) {
      try {
        console.log(`🤖 Forwarding query to Colab API [${colabUrl}/query]...`);
        const colabRes = await axios.post(
          `${colabUrl}/query`,
          { prompt: userQuery, query: userQuery, session_id: sessionId },
          { timeout: 7000, headers: { 'Content-Type': 'application/json' } }
        );

        if (colabRes.data && (colabRes.data.answer || colabRes.data.response)) {
          botResponse = colabRes.data.answer || colabRes.data.response;
          responseSource = 'colab_llm';
          colabSuccess = true;
        }
      } catch (colabErr) {
        console.warn('⚠️ Colab API call failed or timed out:', colabErr.message);
        if (activeMode === 'colab') {
          botResponse = `⚠️ Colab API is currently offline or unreachable (${colabErr.message}). You can switch to Hybrid Mode in settings or paste your updated Colab Ngrok URL.`;
          responseSource = 'system_fallback';
          colabSuccess = true; // prevent KB overwrite if user forced Colab mode
        }
      }
    }

    // Fallback to SQLite Knowledge Base search if Colab didn't answer
    if (!colabSuccess) {
      const kbItems = await dbAll(`SELECT * FROM knowledge_base`);
      const lowerQuery = userQuery.toLowerCase();

      let bestMatch = null;
      let highestScore = 0;

      for (const item of kbItems) {
        const keywords = item.keywords.toLowerCase().split(' ');
        let score = 0;
        for (const kw of keywords) {
          if (kw && lowerQuery.includes(kw)) {
            score += 1;
          }
        }
        // Topic bonus
        if (lowerQuery.includes(item.topic.toLowerCase())) {
          score += 3;
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && highestScore >= 1) {
        botResponse = bestMatch.answer;
        responseSource = 'sqlite_kb';
      } else {
        // Smart Contextual System Fallback
        botResponse = `Thank you for your inquiry regarding "${userQuery}". We couldn't find an exact automated match in our quick FAQ database. Would you like to submit a formal Enquiry Lead to our support team using the Submit Enquiry form? We will respond within 24 hours!`;
        responseSource = 'system_fallback';
      }
    }

    const latency = Date.now() - startTime;

    // Log chat into SQLite
    await dbRun(
      `INSERT INTO chat_logs (session_id, user_query, bot_response, source, latency_ms) VALUES (?, ?, ?, ?, ?)`,
      [sessionId || 'guest-session', userQuery, botResponse, responseSource, latency]
    );

    res.json({
      success: true,
      query: userQuery,
      answer: botResponse,
      source: responseSource,
      latencyMs: latency,
    });
  } catch (err) {
    console.error('❌ Error processing chat query:', err);
    res.status(500).json({ success: false, error: 'Internal server error while processing query.' });
  }
});

// ----------------------------------------------------
// 3. ENQUIRIES (LEADS MANAGEMENT) ENDPOINTS
// ----------------------------------------------------

// Submit New Enquiry Lead
app.post('/api/enquiries', async (req, res) => {
  try {
    const { name, email, phone, category, subject, message, priority } = req.body;

    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: name, email, category, subject, message.',
      });
    }

    const result = await dbRun(
      `INSERT INTO enquiries (name, email, phone, category, subject, message, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), phone ? phone.trim() : '', category, subject.trim(), message.trim(), priority || 'medium']
    );

    const newEnquiry = await dbGet(`SELECT * FROM enquiries WHERE id = ?`, [result.id]);

    res.status(201).json({
      success: true,
      message: 'Enquiry lead submitted successfully and stored in SQLite!',
      enquiry: newEnquiry,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch Enquiries with Search & Category Filter
app.get('/api/enquiries', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let sql = `SELECT * FROM enquiries WHERE 1=1`;
    const params = [];

    if (category && category !== 'All') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (status && status !== 'All') {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY created_at DESC`;

    const enquiries = await dbAll(sql, params);
    res.json({ success: true, count: enquiries.length, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Enquiry Status
app.patch('/api/enquiries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value.' });
    }

    await dbRun(`UPDATE enquiries SET status = ? WHERE id = ?`, [status, id]);
    const updated = await dbGet(`SELECT * FROM enquiries WHERE id = ?`, [id]);

    res.json({ success: true, message: 'Status updated', enquiry: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Enquiry
app.delete('/api/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM enquiries WHERE id = ?`, [id]);
    res.json({ success: true, message: `Enquiry #${id} deleted from SQLite.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 4. ANALYTICS & DASHBOARD METRICS
// ----------------------------------------------------

app.get('/api/analytics', async (req, res) => {
  try {
    const totalEnquiries = await dbGet(`SELECT COUNT(*) as count FROM enquiries`);
    const pendingEnquiries = await dbGet(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'pending'`);
    const resolvedEnquiries = await dbGet(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'resolved'`);
    
    const totalChatLogs = await dbGet(`SELECT COUNT(*) as count FROM chat_logs`);
    const colabQueryCount = await dbGet(`SELECT COUNT(*) as count FROM chat_logs WHERE source = 'colab_llm'`);
    const sqliteKbQueryCount = await dbGet(`SELECT COUNT(*) as count FROM chat_logs WHERE source = 'sqlite_kb'`);
    const avgLatency = await dbGet(`SELECT AVG(latency_ms) as avg FROM chat_logs`);

    const categoryBreakdown = await dbAll(
      `SELECT category, COUNT(*) as count FROM enquiries GROUP BY category ORDER BY count DESC`
    );

    const recentLogs = await dbAll(
      `SELECT * FROM chat_logs ORDER BY timestamp DESC LIMIT 6`
    );

    res.json({
      success: true,
      metrics: {
        totalEnquiries: totalEnquiries.count,
        pendingEnquiries: pendingEnquiries.count,
        resolvedEnquiries: resolvedEnquiries.count,
        totalChatLogs: totalChatLogs.count,
        colabQueries: colabQueryCount.count,
        sqliteKbQueries: sqliteKbQueryCount.count,
        avgLatencyMs: Math.round(avgLatency.avg || 0),
      },
      categoryBreakdown,
      recentLogs,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch Knowledge Base FAQs
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const kb = await dbAll(`SELECT * FROM knowledge_base ORDER BY id ASC`);
    res.json({ success: true, count: kb.length, knowledgeBase: kb });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express Enquiry Bot Server running on http://localhost:${PORT}`);
});
