// server/models/class.js
const { getDb } = require('../utils/mongo');

const ClassModel = {
  async create(data) {
    const db = await getDb();
    return db.collection('classes').insertOne(data);
  },
  async getAll(schoolId) {
    const db = await getDb();
    return db.collection('classes').find({ schoolId }).toArray();
  },
  async update(classId, update) {
    const db = await getDb();
    return db.collection('classes').updateOne({ _id: classId }, { $set: update });
  },
  async delete(classId) {
    const db = await getDb();
    return db.collection('classes').deleteOne({ _id: classId });
  }
};

module.exports = ClassModel;
