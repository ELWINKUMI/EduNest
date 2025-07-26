// Script to create initial super admin
const { MongoClient } = require('mongodb');
const { hashPassword } = require('./server/utils/auth');

const uri = 'mongodb://localhost:27017';
const dbName = 'edunest';

const superAdmin = {
  name: 'Super Admin',
  userId: 'SUPERADMIN',
  password: hashPassword('lithium365'), // Changed password as requested
  role: 'super_admin',
  schoolId: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

(async () => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const exists = await users.findOne({ userId: superAdmin.userId });
  if (exists) {
    // Update password if super admin exists
    await users.updateOne({ userId: superAdmin.userId }, { $set: { password: superAdmin.password, updatedAt: new Date() } });
    console.log('Super admin password updated!');
    console.log('User ID: SUPERADMIN');
    console.log('New Password: lithium365');
  } else {
    await users.insertOne(superAdmin);
    console.log('Super admin created!');
    console.log('User ID: SUPERADMIN');
    console.log('Password: lithium365');
  }
  await client.close();
})();
