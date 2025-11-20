// server/index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// 使用 gemini-1.5-flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const SYSTEM_PROMPT = `
你是一個「AI 助理」，會協助使用者聊天、也會解析行事曆圖片。
請使用自然、親切的繁體中文回覆。
如果有圖片，請先描述圖片內容，再根據問題回答。
`;

// POST /api/chat
app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const imageFile = req.file;

    if (!userMessage && !imageFile) {
      return res.status(400).json({ error: "缺少訊息或圖片" });
    }

    const parts = [
      { text: SYSTEM_PROMPT },
      { text: userMessage }
    ];

    if (imageFile) {
      parts.push({
        inlineData: {
          mimeType: imageFile.mimetype,
          data: imageFile.buffer.toString("base64"),
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    const reply = result.response.text();
    res.json({ reply });

  } catch (error) {
    console.error("❌ LLM Error:", error);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

// Render / Railway port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
