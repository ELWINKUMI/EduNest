// server/models/subject.js
const { getDb } = require('../utils/mongo');

const SubjectModel = {
  async create(data) {
    const db = await getDb();
    return db.collection('subjects').insertOne(data);
  },
  async getAll(schoolId) {
    const db = await getDb();
    return db.collection('subjects').find({ schoolId }).toArray();
  },
  async update(subjectId, update) {
    const db = await getDb();
    return db.collection('subjects').updateOne({ _id: subjectId }, { $set: update });
  },
  async delete(subjectId) {
    const db = await getDb();
    return db.collection('subjects').deleteOne({ _id: subjectId });
  }
};

module.exports = SubjectModel;
