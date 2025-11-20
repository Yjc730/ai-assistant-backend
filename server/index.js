const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// ⭐ 正確可用模型：gemini-1.5-flash-001（支援圖片）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-001"
});

const SYSTEM_PROMPT = `
你是一個「AI 助理」，專門幫使用者聊天與分析行事曆圖片。
回答時請使用繁體中文，語氣自然。
如果有圖片就先描述圖片內容，再根據問題分析。
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

    // 圖片處理
    if (imageFile) {
      parts.push({
        inlineData: {
          data: imageFile.buffer.toString("base64"),
          mimeType: imageFile.mimetype,
        },
      });
    }

    // ⭐ 新版 generateContent
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

// 啟動 server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
