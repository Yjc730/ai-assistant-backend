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

// ⚡ 使用新版 v1 API（你現在 SDK 1.1.0 完全支援）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"   // ⭐ 正確名稱，不要加 -latest、-001
});

const SYSTEM_PROMPT = `
你是一個 AI 助理，會閱讀使用者的訊息與行事曆圖片，並用繁體中文回答。
請在有圖片的時候先簡述圖片內容，再回答問題。
`;

app.post("/api/chat", upload.single("image"), async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const imageFile = req.file;

    if (!userMessage && !imageFile) {
      return res.status(400).json({ error: "缺少訊息或圖片" });
    }

    // ⭐ contents.parts 格式（v1 必須這樣寫）
    const parts = [
      { text: SYSTEM_PROMPT },
      { text: userMessage }
    ];

    if (imageFile) {
      parts.push({
        inlineData: {
          data: imageFile.buffer.toString("base64"),
          mimeType: imageFile.mimetype,
        }
      });
    }

    // ⭐ v1 generateContent 正確寫法
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts
        }
      ]
    });

    const replyText = result.response.text();
    res.json({ reply: replyText });

  } catch (err) {
    console.error("❌ LLM Error:", err);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

// ⭐ Render / Railway 必須這樣寫
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
