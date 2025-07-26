// server/models/teacherAssignment.js
const { getDb } = require('../utils/mongo');

const TeacherAssignmentModel = {
  async assign(teacherId, classIds, subjectIds) {
    const db = await getDb();
    // Remove previous assignments for this teacher
    await db.collection('teacher_assignments').deleteMany({ teacherId });
    // Insert new assignments
    const assignments = [];
    for (const classId of classIds) {
      for (const subjectId of subjectIds) {
        assignments.push({ teacherId, classId, subjectId });
      }
    }
    if (assignments.length) {
      await db.collection('teacher_assignments').insertMany(assignments);
    }
    return assignments;
  },
  async getByTeacher(teacherId) {
    const db = await getDb();
    return db.collection('teacher_assignments').find({ teacherId }).toArray();
  },
  async getByClass(classId) {
    const db = await getDb();
    return db.collection('teacher_assignments').find({ classId }).toArray();
  },
  async getBySubject(subjectId) {
    const db = await getDb();
    return db.collection('teacher_assignments').find({ subjectId }).toArray();
  }
};

module.exports = TeacherAssignmentModel;
