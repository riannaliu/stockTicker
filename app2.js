const express = require("express");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb+srv://dbuser1:hKRRInkedoFbXDis@cluster0.bgwgp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

app.use(express.static("public"));

connectDB();

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
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Route 3: Process Search Query
app.get("/process", async (req, res) => {
  const { search, searchType } = req.query;
  const db = client.db("Stock");
  const collection = db.collection("PublicCompanies");

  console.log("Received search:", search);
  console.log("Search type:", searchType);

  if (!search || !searchType) {
    console.error("Search or searchType missing");
    return res.status(400).send("Search query or search type is missing");
  }

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
      console.log("Search results:");
      results.forEach(result => {
        console.log(`Company: ${result.companyName} | Ticker: ${result.stockTicker} | Price: $${result.latestPrice}`);
      });
      res.send("Search completed. Check the console for results.");
    }
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 4: Update Stock Price
app.get("/update", async (req, res) => {
  const { ticker, newPrice } = req.query;
  const db = client.db("Stock");
  const collection = db.collection("PublicCompanies");

  console.log("Received ticker to update:", ticker);
  console.log("New price:", newPrice);

  if (!ticker || !newPrice) {
    console.error("Ticker or newPrice missing");
    return res.status(400).send("Ticker and new price are required");
  }

  try {
    const result = await collection.updateOne(
      { stockTicker: ticker.trim() },
      { $set: { latestPrice: parseFloat(newPrice) } }
    );

    if (result.matchedCount === 0) {
      console.log("No matching record found to update.");
      res.send("No matching record found to update.");
    } else {
      console.log(`Successfully updated stock price for ticker: ${ticker}`);
      res.send(`Successfully updated stock price for ticker: ${ticker}`);
    }
  } catch (error) {
    console.error("Error updating data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

