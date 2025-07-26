// Quiz model (plain JS, MongoDB native)
const { getDb } = require('../utils/mongo');

const collection = () => getDb().collection('quizzes');

const QuizModel = {
  async create(quiz) {
    quiz.createdAt = new Date();
    quiz.updatedAt = new Date();
    return collection().insertOne(quiz);
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
    return collection().find({ 'responses.studentId': studentId }).toArray();
  }
};

module.exports = QuizModel;
