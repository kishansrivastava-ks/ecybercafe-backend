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

const corsOptions = {
  origin: ["https://ecybercafe.in", "https://www.ecybercafe.in"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware
app.use(helmet());
app.use(compression());
// app.use(
//   cors({
//     origin: ["https://ecybercafe.in", "https://www.ecybercafe.in"],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     credentials: true,
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "Access-Control-Allow-Origin",
//     ],
//   })
// );
app.use(morgan("dev"));
app.use(bodyParser.json());

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
