/**
 * aiService.js
 * Thin wrapper around AI providers (Gemini / OpenAI).
 *
 * Architecture:
 *  - AI_PROVIDER env var selects the provider ("gemini" or "openai")
 *  - If the key is missing or the API call fails, returns null gracefully
 *  - The controller falls back to the deterministic analytics engine if null is returned
 *  - Financial facts calculated from MongoDB are fed to the AI so it never hallucinates numbers
 *
 * IMPORTANT: API keys are ONLY read from process.env — never from frontend requests.
 */

const https = require("https");

const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(systemPrompt, userMessage) {
  if (!GEMINI_KEY) return null;

  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUSER QUESTION: ${userMessage}` }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    },
  });

  return new Promise((resolve) => {
    const url = `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || null;
          resolve(text ? text.trim() : null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, userMessage) {
  if (!OPENAI_KEY) return null;

  const body = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 512,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.choices?.[0]?.message?.content || null;
          resolve(text ? text.trim() : null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function callAI(systemPrompt, userMessage) {
  try {
    if (AI_PROVIDER === "openai") {
      return await callOpenAI(systemPrompt, userMessage);
    }
    return await callGemini(systemPrompt, userMessage);
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a natural-language financial summary from deterministic context.
 * Returns null if AI is unavailable.
 */
async function generateInsightSummary(aiContext) {
  const system = `You are MoneyMate, a friendly personal finance assistant. 
Your job is to write a 2-3 sentence financial summary for the user based on the exact data provided.
Be encouraging, honest, and specific. Always use ₹ for amounts. Never fabricate data.
Write in second-person ("You..."). Do not include markdown codeblocks.`;

  const message = `Here is the user's financial data:
Income this month: ₹${Math.round(aiContext.currentMonth.income).toLocaleString("en-IN")}
Expenses this month: ₹${Math.round(aiContext.currentMonth.expenses).toLocaleString("en-IN")}
Net savings: ₹${Math.round(aiContext.currentMonth.net).toLocaleString("en-IN")}
Savings rate: ${aiContext.currentMonth.savingsRate}%
Largest expense category: ${aiContext.currentMonth.topCategory || "None"}
Financial health score: ${aiContext.healthScore}/100
Budget alerts (exceeded): ${aiContext.budgetAlertsCount}
Active savings goals: ${aiContext.goalsCount}

Write a concise, personalised 2-3 sentence financial summary.`;

  return callAI(system, message);
}

/**
 * Answer a user's financial question using deterministic facts as the ground truth.
 * Returns null if AI is unavailable.
 */
async function generateChatResponse(userMessage, financialContext, questionFacts) {
  const system = `You are MoneyMate AI, a smart personal finance assistant.
Your job is to answer the user's question directly and concisely using ONLY the verified financial facts calculated from the user's database.

CRITICAL RULES:
1. NEVER alter, re-calculate, or invent financial figures. Use the exact numbers provided in the facts.
2. ALWAYS format Indian Rupee amounts with ₹ (e.g. ₹4,850).
3. Structure your response concisely:
   - Direct answer with primary metric/category
   - Supporting context or percentage
   - Helpful actionable financial recommendation
4. Keep the tone friendly, clear, and encouraging. Keep it to 2-4 sentences.
5. If the facts show zero or no data for that period, explain that clearly without guessing.

VERIFIED FACTS FROM USER DATABASE:
${JSON.stringify(questionFacts, null, 2)}

GENERAL FINANCIAL CONTEXT:
${financialContext}`;

  return callAI(system, userMessage);
}

module.exports = {
  generateInsightSummary,
  generateChatResponse,
};
