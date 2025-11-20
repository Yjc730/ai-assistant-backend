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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ⭐️ 正確可用模型（不要用不存在的名稱）⭐️
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

const SYSTEM_PROMPT = `
你是一個 AI 助理...
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
          mimeType: imageFile.mimetype
        }
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    const replyText = result.response.text();
    res.json({ reply: replyText });

  } catch (err) {
    console.error("LLM ERROR:", err);
    res.status(500).json({ error: "LLM 呼叫失敗" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`AI Assistant backend listening on port ${PORT}`);
});
