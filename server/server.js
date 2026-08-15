const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load .env FIRST
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

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
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