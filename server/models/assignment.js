// Assignment model (plain JS, MongoDB native)
const { getDb } = require('../utils/mongo');

const collection = () => getDb().collection('assignments');

const AssignmentModel = {
  async create(assignment) {
    assignment.createdAt = new Date();
    assignment.updatedAt = new Date();
    return collection().insertOne(assignment);
  },
  async findById(id) {
    return collection().findOne({ _id: id });
  },
  async findByCourse(courseId) {
    return collection().find({ courseId }).toArray();
  },
  async update(id, update) {
    update.updatedAt = new Date();
    return collection().updateOne({ _id: id }, { $set: update });
  },
  async findAllWithStudent(studentId) {
    return collection().find({ 'submissions.studentId': studentId }).toArray();
  }
};

module.exports = AssignmentModel;
