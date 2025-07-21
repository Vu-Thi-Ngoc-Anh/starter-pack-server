const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const TOKENS_FILE = './tokens.json';

app.use(cors());
app.use(express.json());

// 👇 Cho phép phục vụ các file tĩnh như show_token.html, panel.png
app.use(express.static(path.join(__dirname)));

// Load/saves tokens
function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TOKENS_FILE));
}

function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// Generate unique token
function generateUniqueCode(tokens) {
  let code;
  do {
    code = uuidv4().split('-')[0];
  } while (tokens.some(t => t.token === code));
  return code;
}

// Tạo token mới
app.post('/generate-token', (req, res) => {
  const tokens = loadTokens();
  const newToken = generateUniqueCode(tokens);
  tokens.push({ token: newToken });
  saveTokens(tokens);
  res.json({ success: true, token: newToken });
});

// Xác minh token
app.post('/verify-token', (req, res) => {
  const { token } = req.body;
  const tokens = loadTokens();
  const found = tokens.find(t => t.token === token);
  if (!found) return res.json({ success: false, message: 'Token không hợp lệ' });

  const updatedTokens = tokens.filter(t => t.token !== token);
  saveTokens(updatedTokens);
  res.json({ success: true, message: 'Token hợp lệ và đã được sử dụng' });
});

// 👇 Route gốc sẽ chuyển tới show_token.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'show_token.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
