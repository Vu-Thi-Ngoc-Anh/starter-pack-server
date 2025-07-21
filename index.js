const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;
const TOKEN_KEY = "StarterPackTokens";

// Tạo token duy nhất
function generateUniqueCode(existingTokens) {
  let token;
  do {
    token = uuidv4().slice(0, 8);
  } while (existingTokens.includes(token));
  return token;
}

// Load danh sách token hiện có từ PlayFab TitleData
async function loadTokensFromPlayFab() {
  try {
    const response = await axios.post(
      `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/GetTitleData`,
      { Keys: [TOKEN_KEY] },
      {
        headers: {
          "X-SecretKey": PLAYFAB_SECRET_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data?.Data?.[TOKEN_KEY];
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Lỗi khi tải token:", err.response?.data || err);
    return [];
  }
}

// Ghi thêm token mới vào TitleData (không ghi đè)
async function saveTokensToPlayFab(newTokens) {
  try {
    const currentTokens = await loadTokensFromPlayFab();
    const mergedTokens = Array.from(new Set([...currentTokens, ...newTokens]));

    await axios.post(
      `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/SetTitleData`,
      {
        Key: TOKEN_KEY,
        Value: JSON.stringify(mergedTokens)
      },
      {
        headers: {
          "X-SecretKey": PLAYFAB_SECRET_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Lỗi khi lưu token:", err.response?.data || err);
  }
}

// API tạo token mới
app.post('/generate-token', async (req, res) => {
  try {
    const currentTokens = await loadTokensFromPlayFab();
    const newToken = generateUniqueCode(currentTokens);
    await saveTokensToPlayFab([newToken]);
    res.json({ success: true, token: newToken });
  } catch (err) {
    console.error("Lỗi ở /generate-token:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// API xem toàn bộ token (debug)
app.get('/tokens', async (req, res) => {
  try {
    const tokens = await loadTokensFromPlayFab();
    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
