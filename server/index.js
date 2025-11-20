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

// 用 gemini-1.5-flash（新版 v1 API）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const SYSTEM_PROMPT = `
你是一個「AI 助理」，會協助使用者聊天，也會解析行事曆截圖。
回答請用自然的繁體中文。
請先描述圖片，再回答問題。
`;

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
          data: imageFile.buffer.toString("base64"),
          mimeType: imageFile.mimetype,
        },
      });
    }

    // ❗ 新版 v1 用法
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    res.json({ reply: result.response.text() });

  } catch (error) {
    console.error("❌ LLM Error:", error);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
