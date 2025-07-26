// MongoDB connection utility
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Update if needed
const dbName = 'edunest';

let db = null;

async function connectToMongo() {
  if (db) return db;
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getDb() {
  if (!db) throw new Error('DB not connected');
  return db;
}

module.exports = { connectToMongo, getDb };
