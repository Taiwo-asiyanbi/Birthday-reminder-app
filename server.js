const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();


const app = express();
app.use(express.json());
app.use(express.static("public")); 

// MongoDB connection locally
// mongoose.connect("mongodb://taiwo111:asiyanbi@ac-39whf0p-shard-00-00.mk9pow9.mongodb.net:27017,ac-39whf0p-shard-00-01.mk9pow9.mongodb.net:27017,ac-39whf0p-shard-00-02.mk9pow9.mongodb.net:27017/?ssl=true&replicaSet=atlas-his64d-shard-0&authSource=admin&appName=birthday-cluster");

mongoose.connect(process.env.MONGO_URI, 
  )
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));


// Schema
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  dob: Date
});
const User = mongoose.model("User", UserSchema);

// Route to add user
app.post("/api/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send("User saved");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// HTML Email Template
function sendBirthdayEmail(to, name) {
  const mailOptions = {
    from: "your-email@gmail.com",
    to,
    subject: "Happy Birthday 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; background: #f9f9f9; padding: 20px;">
        <div style="background: #ffcc00; padding: 20px; border-radius: 10px;">
          <h1 style="color: #333;">🎂 Happy Birthday, ${name}! 🎂</h1>
          <p style="font-size: 16px; color: #555;">
            Wishing you a day filled with joy, laughter, and wonderful surprises.
          </p>

        </div>
        <footer style="margin-top: 20px; font-size: 12px; color: #999;">
          ✨ This message was sent automatically by the Birthday Reminder App ✨
        </footer>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error(err);
    else console.log("Email sent: " + info.response);
  });
}

// Cron job: runs daily at 7am
cron.schedule("0 7 * * *", async () => {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();

  const users = await User.find();
  users.forEach(user => {
    const dob = new Date(user.dob);
    if (dob.getMonth() === month && dob.getDate() === day) {
      sendBirthdayEmail(user.email, user.username);
    }
  });
});

app.listen(7000, () => console.log("Server running on port 7000"));
