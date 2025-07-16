const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(process.env.DB_NAME);
      console.log('Conectado ao MongoDB com sucesso!');
    } catch (error) {
      console.error('Erro ao conectar com MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Desconectado do MongoDB');
    }
  }

  getCollection() {
    return this.db.collection(process.env.COLLECTION_NAME);
  }

  isValidObjectId(id) {
    return ObjectId.isValid(id);
  }

  createObjectId(id) {
    return new ObjectId(id);
  }
}

module.exports = new Database();
