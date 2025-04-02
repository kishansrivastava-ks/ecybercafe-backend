import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import bodyParser from "body-parser";
// import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import fileUpload from "express-fileupload";
import path from "path";

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
// Enable CORS (allow all origins)
app.use(
  cors({
    origin: "*", // Change this to your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    abortOnLimit: true,
  })
);
// Serve static files (important for accessing uploaded files)
const __dirname = path.resolve();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("cross-origin-resource-policy", "cross-origin"); // Allow cross-origin requests
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
