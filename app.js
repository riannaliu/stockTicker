const express = require("express");
require('dotenv').config();
const { MongoClient } = require("mongodb");
const fs = require("fs");
require("dotenv").config(); // Load .env file for MongoDB URI

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

connectDB();

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public")); // Serve static files

// Routes

// Route 1: Insert data from file
app.get("/insert-data", async (req, res) => {
  try {
    const db = client.db("Stock");
    const collection = db.collection("PublicCompanies");

    const fileName = "companies.csv";
    const data = fs.readFileSync(fileName, "utf8").split("\n");

    // Skip the header and process each line
    for (let i = 1; i < data.length; i++) {
      const line = data[i].trim();
      if (!line) continue; // Skip empty lines

      const [companyName, stockTicker, stockPrice] = line.split(",");
      await collection.insertOne({
        companyName: companyName.trim(),
        stockTicker: stockTicker.trim(),
        latestPrice: parseFloat(stockPrice.trim()),
      });
    }

    console.log("Data inserted successfully!");
    res.send("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error.message);
    res.status(500).send("Error inserting data");
  }
});

// Route 2: Home View (Search Form)
app.get("/", (req, res) => {
  res.render("home");
});

// Route 3: Process Search Query
app.get("/process", async (req, res) => {
  const { search, searchType } = req.query;
  const db = client.db("Stock");
  const collection = db.collection("PublicCompanies");

  try {
    let results = [];
    if (searchType === "ticker") {
      results = await collection.find({ stockTicker: new RegExp(search, "i") }).toArray();
    } else if (searchType === "company") {
      results = await collection.find({ companyName: new RegExp(search, "i") }).toArray();
    }

    if (results.length === 0) {
      console.log("No matching records found.");
      res.send("No results found. Please try again.");
    } else {
      console.log("Results:", results);
      res.render("results", { results });
    }
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

