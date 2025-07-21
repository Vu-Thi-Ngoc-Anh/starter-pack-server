const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const TOKENS_FILE = './tokens.json';

app.use(cors());
app.use(express.json());

// Đọc tokens từ file
function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TOKENS_FILE));
}

// Ghi tokens vào file
function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// ✅ API: Tạo token mới (admin tạo trước khi gửi cho người dùng)
app.post('/generate-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Thiếu token' });

  let tokens = loadTokens();
  if (tokens.find(t => t.token === token)) {
    return res.status(400).json({ error: 'Token đã tồn tại' });
  }

  tokens.push({ token });
  saveTokens(tokens);

  res.json({ success: true });
});

// ✅ API: Người chơi gửi mã {token}+{uid}
app.post('/verify-token', (req, res) => {
  const { code } = req.body; // VD: "abc123+uid456"
  if (!code || !code.includes('+')) {
    return res.status(400).json({ error: 'Code không hợp lệ' });
  }

  const [token, uid] = code.split('+');
  if (!token || !uid) return res.status(400).json({ error: 'Thiếu token hoặc uid' });

  let tokens = loadTokens();
  const index = tokens.findIndex(t => t.token === token);

  if (index === -1) return res.json({ success: false, message: 'Token không hợp lệ hoặc đã dùng rồi' });

  // 👉 Ở đây: bạn có thể gọi cập nhật PlayFab hoặc xử lý gì tùy ý

  // Xóa token sau khi dùng
  tokens.splice(index, 1);
  saveTokens(tokens);

  res.json({ success: true, message: 'Mã hợp lệ, đã được sử dụng và xóa', uid });
});

// ✅ Trang chủ
app.get('/', (req, res) => {
  res.send("🟢 Starter Pack Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
