// School model (plain JS, MongoDB native)
const { getDb } = require('../utils/mongo');

const collection = () => getDb().collection('schools');

const SchoolModel = {
  async create(school) {
    school.createdAt = new Date();
    school.updatedAt = new Date();
    return collection().insertOne(school);
  },
  async findById(id) {
    return collection().findOne({ _id: id });
  },
  async findByName(name) {
    return collection().findOne({ name });
  },
  async update(id, update) {
    update.updatedAt = new Date();
    return collection().updateOne({ _id: id }, { $set: update });
  },
  async getAll() {
    return collection().find({}).toArray();
  }
};

module.exports = SchoolModel;
