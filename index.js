const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;
const TOKEN_KEY = "StarterPackTokens";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // thư mục giao diện

// Load token từ PlayFab
async function loadTokensFromPlayFab() {
  try {
    const res = await axios.post(
      `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/GetTitleData`,
      { Keys: [TOKEN_KEY] },
      {
        headers: {
          "X-SecretKey": PLAYFAB_SECRET_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    const data = res.data.Data;
    if (!data || !data[TOKEN_KEY]) return [];
    return JSON.parse(data[TOKEN_KEY]);
  } catch (err) {
    console.error("Lỗi khi load token từ PlayFab:", err.response?.data || err);
    return [];
  }
}

// Lưu token lên PlayFab
async function saveTokensToPlayFab(tokens) {
  try {
    await axios.post(
      `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/SetTitleData`,
      {
        Key: TOKEN_KEY,
        Value: JSON.stringify(tokens)
      },
      {
        headers: {
          "X-SecretKey": PLAYFAB_SECRET_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Lỗi khi lưu token lên PlayFab:", err.response?.data || err);
  }
}

// Tạo mã không trùng
function generateUniqueCode(tokens) {
  let code;
  do {
    code = uuidv4().split('-')[0];
  } while (tokens.includes(code));
  return code;
}

// API: Tạo token
app.post('/generate-token', async (req, res) => {
  try {
    const tokens = await loadTokensFromPlayFab();
    const newToken = generateUniqueCode(tokens);
    tokens.push(newToken);
    await saveTokensToPlayFab(tokens);
    res.json({ success: true, token: newToken });
  } catch (err) {
    console.error("Lỗi ở /generate-token:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// API: Xác minh token
app.post('/verify-token', async (req, res) => {
  const { token } = req.body;
  const tokens = await loadTokensFromPlayFab();
  const index = tokens.indexOf(token);
  if (index === -1) {
    return res.json({ success: false, message: 'Token không hợp lệ' });
  }
  tokens.splice(index, 1);
  await saveTokensToPlayFab(tokens);
  res.json({ success: true, message: 'Token hợp lệ và đã được sử dụng' });
});

// Trang frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'show_token.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
