// server/index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const upload = multer(); // memory storage

app.use(cors());
app.use(express.json());

// 🚀 使用新版 Google Gemini 1.5 Flash（支援圖片）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// 系統提示
const SYSTEM_PROMPT = `
你是一個 AI 助理，可以聊天並分析行事曆圖片。
請用自然、友善的繁體中文回答。
如果有圖片，請先描述你看到的內容，再整理出使用者想要的時段資訊。
`;

app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const file = req.file;

    if (!userMessage && !file) {
      return res.status(400).json({ error: "缺少訊息或圖片" });
    }

    const parts = [
      { text: SYSTEM_PROMPT },
      { text: userMessage }
    ];

    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype
        }
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    res.json({ reply: result.response.text() });

  } catch (err) {
    console.error("❌ LLM Error:", err);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

// Render 自動給 PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("AI Assistant backend running on port", PORT);
});
