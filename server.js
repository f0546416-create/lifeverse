/* =============================================
   LIFEVERSE — AI BILL ANALYSIS SERVER
   server.js
   POST /analyze  — accepts a bill image,
   sends it to Google Gemini, returns JSON
   with usage, cost, currency, carbon, tips.

   SETUP:
     1. Create a .env file with:
          GEMINI_API_KEY=your_api_key_here
     2. npm install
     3. npm start
============================================= */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const { GoogleGenAI } = require('@google/genai');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname)));

// ===== FILE UPLOAD =====
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed.'));
    }
  },
});

// ===== GEMINI AI =====
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not set in .env — AI analysis will fail.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'missing' });

// ===== ANALYZE ENDPOINT =====
app.post('/analyze', upload.single('bill'), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const imageBytes = fs.readFileSync(filePath);

    const imagePart = {
      inlineData: {
        mimeType: req.file.mimetype,
        data: imageBytes.toString('base64'),
      },
    };

    const prompt = `
You are an electricity bill analyzer.
Read the uploaded electricity bill image carefully.
Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "usage": "<number only>",
  "cost": "<number only>",
  "currency": "<currency code, e.g. USD, EGP, EUR>",
  "carbon": "<number only, estimate using 0.4 kg per kWh>",
  "tips": [
    "<personalised tip 1>",
    "<personalised tip 2>",
    "<personalised tip 3>"
  ]
}

Rules:
- usage: electricity consumption in kWh
- cost: total bill amount
- carbon: CO2 in kg (usage × 0.4 if not shown)
- Give exactly 3 actionable, personalised eco tips
- Numbers only (no units in the JSON values)
- If a value cannot be found, use "0"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, imagePart],
        },
      ],
    });

    // Clean any accidental markdown fences
    let text = response.text.trim();
    text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

    // Validate JSON
    JSON.parse(text); // throws if invalid

    res.setHeader('Content-Type', 'application/json');
    res.send(text);

  } catch (err) {
    console.error('Analysis error:', err.message || err);
    res.status(500).json({ error: 'Analysis failed. ' + (err.message || '') });
  } finally {
    // Always clean up temp file
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`✅ LifeVerse AI Server running at http://localhost:${PORT}`);
  console.log(`   API key: ${apiKey ? '✓ loaded from .env' : '✗ missing — set GEMINI_API_KEY in .env'}`);
});
