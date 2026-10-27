const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const path = require("path");

// Load .env FIRST (checks both current folder and server dir)
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require(
  "./routes/authRoutes"
);

const transactionRoutes = require(
  "./routes/transactionRoutes"
);

const budgetRoutes = require(
  "./routes/budgetRoutes"
);

const goalRoutes = require(
  "./routes/goalRoutes"
);

const analyticsRoutes = require(
  "./routes/analyticsRoutes"
);

const aiRoutes = require(
  "./routes/aiRoutes"
);

const recurringRoutes = require(
  "./routes/recurringRoutes"
);

const notificationRoutes = require(
  "./routes/notificationRoutes"
);

const forecastingRoutes = require(
  "./routes/forecastingRoutes"
);

const reportRoutes = require(
  "./routes/reportRoutes"
);

const challengeRoutes = require(
  "./routes/challengeRoutes"
);

const {
  startRecurringScheduler,
} = require(
  "./services/recurringScheduler"
);

const {
  notFound,
  errorHandler,
} = require(
  "./middleware/errorMiddleware"
);

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

const envClientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  ...envClientUrls,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowedExplicit = allowedOrigins.includes(normalizedOrigin);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isVercelDomain = /^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/.test(normalizedOrigin);

      if (isAllowedExplicit || isLocalhost || isVercelDomain) {
        return callback(null, true);
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MoneyMate API is running 🚀",
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  const connected =
    mongoose.connection.readyState === 1;

  res.status(
    connected ? 200 : 503
  ).json({
    success: connected,

    server: "running",

    database: connected
      ? "connected"
      : "disconnected",

    databaseName:
      mongoose.connection.name || null,
  });
});

// ============================================
// API ROUTES
// ============================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/budgets",
  budgetRoutes
);

app.use(
  "/api/goals",
  goalRoutes
);

app.use(
  "/api/analytics",
  analyticsRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/recurring",
  recurringRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/forecast",
  forecastingRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/challenges",
  challengeRoutes
);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFound);

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start background recurring payments and reminders scheduler
    startRecurringScheduler();

    app.listen(PORT, () => {
      console.log("");
      console.log(
        "===================================="
      );

      console.log(
        "🚀 MoneyMate Backend Started"
      );

      console.log(
        `🌐 http://localhost:${PORT}`
      );

      console.log(
        "===================================="
      );
    });
  } catch (error) {
    console.error(
      "❌ Server failed to start:",
      error.message
    );

    process.exit(1);
  }
};

startServer();