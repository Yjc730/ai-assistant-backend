// server/index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const upload = multer(); // 把上傳的檔案放在記憶體

app.use(cors());
app.use(express.json());

// 用 GEMINI_API_KEY 建立模型
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
你是一個「AI 助理」，專門幫使用者聊天與分析行事曆圖片。
回答時請使用繁體中文，語氣自然一點。
如果有圖片就先說你看到了什麼，再根據文字問題做整理。
`;

// 這個就是前端會呼叫的 API：POST /api/chat
app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const imageFile = req.file; // 可選的圖片

    if (!userMessage && !imageFile) {
      return res.status(400).json({ error: "缺少訊息或圖片" });
    }

    const parts = [{ text: SYSTEM_PROMPT }, { text: userMessage }];

    // 如果有圖片就一併丟給 Gemini
    if (imageFile) {
      parts.push({
        inlineData: {
          data: imageFile.buffer.toString("base64"),
          mimeType: imageFile.mimetype,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const replyText = result.response.text();
    res.json({ reply: replyText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

// Render/Railway 會自己給 PORT，用環境變數拿
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
