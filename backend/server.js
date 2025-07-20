const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

require("./db");

const userRoutes = require("./routes/user.routes");
const driveFilesRoutes = require("./routes/driveFiles.routes");
const duplicateRoutes = require("./routes/duplicates.routes");
const googleAuthRoutes = require("./routes/googleAuth");
const reportRoutes=require("./routes/reports.routes")
const MailRoutes=require("./routes/gmailsubscriptions.routes")
const topicRoutes = require("./routes/topics");
const localFilesRoutes =require("./routes/localFiles.routes.js");


const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/auth/google", googleAuthRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/driveFiles", driveFilesRoutes);
app.use("/api/duplicates", duplicateRoutes); 
app.use("/api/reports", reportRoutes); 
app.use("/api/gmail", MailRoutes); 
app.use("/api/topics", topicRoutes);
app.use("/api/localFiles", localFilesRoutes);


app.get("/", (req, res) => {
  res.send("API is working");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
