
// MongoDB connection
const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB URI and Database setup
const uri = "mongodb+srv://dbuser1:hKRRInkedoFbXDis@cluster0.bgwgp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function main() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("Stock");
    const collection = db.collection("PublicCompanies");

    // File to read
    const fileName = "companies-1.csv";

    // Read the file line by line
    const data = fs.readFileSync(fileName, "utf8").split("\n");

    // Skip the header and process each line
    for (let i = 1; i < data.length; i++) {
      const line = data[i].trim();
      if (!line) continue; // Skip empty lines

      // Split the line by comma
      const [companyName, stockTicker, stockPrice] = line.split(",");

      // Display the line in the console
      console.log(`Company: ${companyName}, Ticker: ${stockTicker}, Price: ${stockPrice}`);

      // Insert the data into MongoDB
      await collection.insertOne({
        companyName: companyName.trim(),
        stockTicker: stockTicker.trim(),
        latestPrice: parseFloat(stockPrice.trim()),
      });
    }

    console.log("All data inserted successfully!");
  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    await client.close();
  }
}

// Run the script
main();
