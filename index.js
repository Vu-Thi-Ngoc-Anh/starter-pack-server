const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TOKENS_FILE = './tokens.json';

function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TOKENS_FILE));
}

function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}


app.post('/generate-token', (req, res) => {
  const { token, email } = req.body;
  if (!token || !email) return res.status(400).json({ error: 'Thiếu token hoặc email' });

  let tokens = loadTokens();
  tokens.push({ token, email });
  saveTokens(tokens);

  res.json({ success: true });
});


app.post('/verify-token', (req, res) => {
  const { token, email } = req.body;
  const tokens = loadTokens();
  const found = tokens.find(t => t.token === token && t.email === email);
  if (!found) return res.json({ success: false, message: 'Token không hợp lệ' });

  res.json({ success: true, message: 'Token hợp lệ' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
