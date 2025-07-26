// Course model (plain JS, MongoDB native)
const { getDb } = require('../utils/mongo');

const collection = () => getDb().collection('courses');

const CourseModel = {
  async create(course) {
    course.createdAt = new Date();
    course.updatedAt = new Date();
    return collection().insertOne(course);
  },
  async findById(id) {
    return collection().findOne({ _id: id });
  },
  async findByTeacher(teacherId) {
    return collection().find({ teacherId }).toArray();
  },
  async update(id, update) {
    update.updatedAt = new Date();
    return collection().updateOne({ _id: id }, { $set: update });
  },
  async findByClassLevel(classLevel, schoolId) {
    return collection().find({ classLevel, schoolId }).toArray();
  },
  async findBySchool(schoolId) {
    return collection().find({ schoolId }).toArray();
  }
};

module.exports = CourseModel;
