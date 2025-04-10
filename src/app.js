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
import documentRoutes from "./routes/documentRoutes.js";

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
// app.use(
//   fileUpload({
//     createParentPath: true,
//     limits: {
//       fileSize: 5 * 1024 * 1024,
//     },
//     abortOnLimit: true,
//   })
// );

app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    useTempFiles: false,
  })
);

const __dirname = path.resolve();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("cross-origin-resource-policy", "cross-origin");
    },
  })
);

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")), {
//   setHeaders: (res, path) => {
//     res.setHeader("cross-origin-resource-policy", "cross-origin"); // Allow cross-origin requests
//   },
// });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/document", documentRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
