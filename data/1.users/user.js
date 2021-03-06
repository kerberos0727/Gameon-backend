const faker = require('faker')
const ObjectID = require('mongodb').ObjectID

module.exports = [
  {
    _id: new ObjectID(),
    provider: 'local',
    email: 'admin@admin.com',
    phone: '+123456789',
    password: '$2a$05$2KOSBnbb0r.0TmMrvefbluTOB735rF/KRZb4pmda4PdvU9iDvUB26',
    role: 'admin',
    verified: true,
    verification: '123456',
    creator: new ObjectID(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  }
]
