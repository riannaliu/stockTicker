const http = require("http");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb+srv://dbuser1:hKRRInkedoFbXDis@cluster0.bgwgp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

connectDB();

// Server and Routing
http.createServer(async (req, res) => {
  const url = req.url;

  if (url === "/") {
    // Home page
    res.writeHead(200, { "Content-Type": "text/html" });
    const homePage = fs.readFileSync(path.join(__dirname, "public", "home.html"), "utf8");
    res.write(homePage);
    res.end();

  } else if (url.startsWith("/process")) {
    // Process Search Query
    const urlParams = new URLSearchParams(url.split("?")[1]);
    const search = urlParams.get("search");
    const searchType = urlParams.get("searchType");

    const db = client.db("Stock");
    const collection = db.collection("PublicCompanies");

    try {
      let results = [];
      if (searchType === "ticker") {
        results = await collection.find({ stockTicker: new RegExp(search, "i") }).toArray();
      } else if (searchType === "company") {
        results = await collection.find({ companyName: new RegExp(search, "i") }).toArray();
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      if (results.length === 0) {
        res.write("No results found.");
      } else {
        results.forEach(result => {
          res.write(`Company: ${result.companyName} | Ticker: ${result.stockTicker} | Price: $${result.latestPrice}\n`);
        });
      }
      res.end();

    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write("Internal Server Error");
      res.end();
      console.error("Error fetching data:", error.message);
    }

  } else {
    // 404 Not Found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.write("404 Not Found");
    res.end();
  }
}).listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
