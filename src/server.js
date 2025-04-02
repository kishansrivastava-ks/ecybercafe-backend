import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/dotenv.js";

// Connect to database
connectDB();

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
