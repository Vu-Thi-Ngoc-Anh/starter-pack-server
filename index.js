const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

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

// ✅ API tạo token mới cho 1 người chơi (sau khi thanh toán)
app.post('/generate-token', (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'Thiếu UID' });

  const code = uuidv4().split('-')[0]; // Mã ngắn gọn
  const fullToken = `${code}+${uid}`;

  let tokens = loadTokens();
  tokens.push({ token: fullToken });
  saveTokens(tokens);

  res.json({ success: true, token: fullToken });
});

// ✅ API xác minh token và xóa sau khi dùng
app.post('/verify-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Thiếu token' });

  let tokens = loadTokens();
  const index = tokens.findIndex(t => t.token === token);
  if (index === -1) return res.json({ success: false, message: 'Token không hợp lệ hoặc đã dùng' });

  const usedToken = tokens[index];
  tokens.splice(index, 1); // Xoá token đã dùng
  saveTokens(tokens);

  res.json({ success: true, message: 'Token hợp lệ', token: usedToken.token });
});

// ✅ Trang chính
app.get("/", (req, res) => {
  res.send("🟢 Starter Pack Server is running!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
