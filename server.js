/* =============================================
   LIFEVERSE — AI BILL ANALYSIS SERVER
   server.js

   POST /analyze  — accepts a bill image or PDF,
   sends it to Google Gemini Vision, returns JSON:
   {
     usage, cost, currencyCode, currencySymbol,
     formattedCost, carbon, ecoScore, tips[3],
     billDetails: { provider, period, accountNo,
                    dueDate, meterReading }
   }

   SETUP:
     1. Create a .env file:  GEMINI_API_KEY=your_key
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
app.use(express.static(path.join(__dirname)));

// ===== FILE UPLOAD =====
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp',
      'image/gif',  'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) and PDFs are allowed.'));
    }
  },
});

// ===== GEMINI AI =====
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not set in .env');
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'missing' });

// ===== CURRENCY SYMBOL MAP (fallback) =====
const CURRENCY_SYMBOLS = {
  USD:'$', EUR:'€', GBP:'£', EGP:'E£', SAR:'﷼', AED:'د.إ',
  KWD:'KD', QAR:'QR', BHD:'BD', JOD:'JD', MAD:'MAD', TND:'TND',
  JPY:'¥', CNY:'¥', INR:'₹', PKR:'₨', BDT:'৳', NGN:'₦',
  ZAR:'R',  BRL:'R$', MXN:'$', CAD:'CA$', AUD:'A$', NZD:'NZ$',
  CHF:'CHF',SEK:'kr', NOK:'kr', DKK:'kr', PLN:'zł', TRY:'₺',
  RUB:'₽',  ILS:'₪', THB:'฿', IDR:'Rp', VND:'₫', PHP:'₱',
};

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
        mimeType: req.file.mimetype === 'application/pdf'
          ? 'application/pdf'
          : req.file.mimetype,
        data: imageBytes.toString('base64'),
      },
    };

    /* -------------------------------------------------------
       PROMPT — instructs Gemini to read the REAL bill values
       and return them in a strict JSON format.
    ------------------------------------------------------- */
    const prompt = `You are an expert electricity bill reader and data extractor.

Carefully examine every part of this bill image.

Your job is to extract the REAL values printed on this bill — do NOT estimate or make up numbers.

Return ONLY a single valid JSON object. No markdown. No explanation. No code fences.

Use exactly this structure:

{
  "usage": "<kWh number as string, e.g. '320.5'>",
  "cost": "<total amount due as a plain number string, e.g. '145.75'>",
  "currencyCode": "<ISO 4217 currency code detected from the bill, e.g. 'USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED'>",
  "currencySymbol": "<the actual currency symbol shown on the bill, e.g. '$', 'EGP', '£', '€', '﷼'>",
  "formattedCost": "<the full cost string exactly as it appears on the bill, e.g. 'EGP 145.75' or '$89.40'>",
  "carbon": "<CO₂ kg as number string — calculate as usage × 0.4 if not printed>",
  "ecoScore": "<integer 0-100 — 100 minus carbon capped at 100, minimum 5>",
  "tips": [
    "<specific personalised saving tip based on this exact bill>",
    "<specific personalised saving tip based on this exact bill>",
    "<specific personalised saving tip based on this exact bill>"
  ],
  "billDetails": {
    "provider":     "<electricity company name if visible, else ''>",
    "period":       "<billing period if visible, e.g. 'June 2026', else ''>",
    "accountNo":    "<account or customer number if visible, else ''>",
    "dueDate":      "<payment due date if visible, else ''>",
    "meterReading": "<meter reading if visible, else ''>"
  }
}

Critical rules:
1. cost must be the TOTAL AMOUNT DUE printed on the bill — the real number, not estimated.
2. currencyCode: detect from currency symbols, country context, or text on the bill. If you see £ use GBP, $ use USD, € use EUR, ج.م or EGP use EGP, ﷼ use SAR, etc.
3. currencySymbol: copy the exact symbol or abbreviation as shown on the bill.
4. formattedCost: copy the cost exactly as printed, including symbol and amount.
5. If a field is genuinely not visible, use an empty string "" — never invent data.
6. tips must be specific to the usage level and cost shown on this bill.
7. All number fields must be plain number strings with no units inside them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, imagePart],
        },
      ],
    });

    // Strip any accidental markdown fences Gemini sometimes adds
    let text = (response.text || '').trim();
    text = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i,     '')
      .replace(/```\s*$/,      '')
      .trim();

    // Parse to validate
    const parsed = JSON.parse(text);

    // ---- Fill in currencySymbol from map if Gemini left it blank ----
    if (!parsed.currencySymbol && parsed.currencyCode) {
      parsed.currencySymbol = CURRENCY_SYMBOLS[parsed.currencyCode.toUpperCase()] || parsed.currencyCode;
    }

    // ---- Build formattedCost if Gemini didn't produce one ----
    if (!parsed.formattedCost && parsed.cost && parsed.cost !== '0') {
      const sym = parsed.currencySymbol || parsed.currencyCode || '';
      parsed.formattedCost = `${sym}${parsed.cost}`;
    }

    // ---- Compute ecoScore if missing ----
    if (!parsed.ecoScore) {
      const carbon = parseFloat(parsed.carbon) || 0;
      parsed.ecoScore = String(Math.max(5, Math.min(100, Math.round(100 - carbon))));
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(parsed);

  } catch (err) {
    console.error('Analysis error:', err.message || err);
    res.status(500).json({ error: 'Analysis failed: ' + (err.message || 'unknown error') });
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aiReady: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`\n✅  LifeVerse AI Bill Server  →  http://localhost:${PORT}`);
  console.log(`    Gemini API key : ${apiKey ? '✓ loaded' : '✗ missing — set GEMINI_API_KEY in .env'}`);
  console.log(`    Static files   : ${path.join(__dirname)}\n`);
});
