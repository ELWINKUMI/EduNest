// User model (plain JS, MongoDB native)
const { getDb } = require('../utils/mongo');

const collection = () => getDb().collection('users');

const UserModel = {
  async updateByUserId(userId, update) {
    update.updatedAt = new Date();
    return collection().updateOne({ userId }, { $set: update });
  },
  async create(user) {
    user.createdAt = new Date();
    user.updatedAt = new Date();
    return collection().insertOne(user);
  },
  async findByEmail(email) {
    return collection().findOne({ email });
  },
  async findById(id) {
    const { ObjectId } = require('mongodb');
    let _id = id;
    if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) {
      try { _id = new ObjectId(id); } catch {}
    }
    return collection().findOne({ _id });
  },
  async update(id, update) {
    update.updatedAt = new Date();
    return collection().updateOne({ _id: id }, { $set: update });
  },
  async findBySchool(schoolId) {
    return collection().find({ schoolId }).toArray();
  },
  async findByUserId(userId) {
    return collection().findOne({ userId });
  }
};

module.exports = UserModel;
