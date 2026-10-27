
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: {
    type: String,
    required: true,
    enum: ["Food", "Travel", "Bills", "Shopping", "Other"]
  },
  date: { type: Date, required: true }
});

const Expense = mongoose.model("Expense", expenseSchema);

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
      .catch(error => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({ message: "Database connection failed" });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch expenses" });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (
      typeof title !== "string" || !title.trim() ||
      amount === "" || amount === null || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
      !["Food", "Travel", "Bills", "Shopping", "Other"].includes(category) ||
      !date || Number.isNaN(Date.parse(date))
    ) {
      return res.status(400).json({ message: "Invalid expense details" });
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category,
      date: new Date(date)
    });

    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (error) {
    res.status(500).json({ message: "Could not add expense" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const { title, amount, category, date } = req.body;

    if (
      typeof title !== "string" || !title.trim() ||
      amount === "" || amount === null || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
      !["Food", "Travel", "Bills", "Shopping", "Other"].includes(category) ||
      !date || Number.isNaN(Date.parse(date))
    ) {
      return res.status(400).json({ message: "Invalid expense details" });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title: title.trim(), amount: Number(amount), category, date: new Date(date) },
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense updated successfully", expense });
  } catch (error) {
    res.status(500).json({ message: "Could not update expense" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete expense" });
  }
});

module.exports = app;
