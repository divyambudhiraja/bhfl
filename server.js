import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

/* -------------------- ROOT ROUTE -------------------- */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API is running",
    health: "/health",
    bfhl: "/bfhl"
  });
});

/* -------------------- UTILITY FUNCTIONS -------------------- */

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcmTwo = (a, b) => (a * b) / gcd(a, b);

/* -------------------- HEALTH CHECK -------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

/* -------------------- BFHL API -------------------- */

app.post("/bfhl", async (req, res) => {
  try {
    const keys = Object.keys(req.body);

    // Exactly one key required
    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        error: "Request must contain exactly one key"
      });
    }

    const key = keys[0];
    const value = req.body[key];
    let data;

    /* ---------- Fibonacci ---------- */
    if (key === "fibonacci") {
      if (!Number.isInteger(value) || value < 0) {
        return res.status(400).json({
          is_success: false,
          error: "Fibonacci requires a non-negative integer"
        });
      }

      let a = 0, b = 1;
      data = [];
      for (let i = 0; i < value; i++) {
        data.push(a);
        [a, b] = [b, a + b];
      }
    }

    /* ---------- Prime ---------- */
    else if (key === "prime") {
      if (!Array.isArray(value)) {
        return res.status(400).json({
          is_success: false,
          error: "Prime requires an integer array"
        });
      }

      data = value.filter(n => Number.isInteger(n) && isPrime(n));
    }

    /* ---------- LCM ---------- */
    else if (key === "lcm") {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({
          is_success: false,
          error: "LCM requires a non-empty integer array"
        });
      }

      data = value.reduce((acc, num) => lcmTwo(acc, num));
    }

    /* ---------- HCF ---------- */
    else if (key === "hcf") {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({
          is_success: false,
          error: "HCF requires a non-empty integer array"
        });
      }

      data = value.reduce((acc, num) => gcd(acc, num));
    }

    /* ---------- AI ---------- */
    else if (key === "AI") {
      if (typeof value !== "string" || value.trim() === "") {
        return res.status(400).json({
          is_success: false,
          error: "AI requires a non-empty question string"
        });
      }

      const aiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: value }]
            }
          ]
        }
      );

      const text =
        aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // single-word response
      data = text.trim().split(/\s+/)[0] || "Unknown";
    }

    /* ---------- Invalid Key ---------- */
    else {
      return res.status(400).json({
        is_success: false,
        error: "Invalid key"
      });
    }

    /* ---------- SUCCESS RESPONSE ---------- */
    return res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch (err) {
    return res.status(500).json({
      is_success: false,
      error: "Internal server error"
    });
  }
});

/* -------------------- SERVER START -------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
