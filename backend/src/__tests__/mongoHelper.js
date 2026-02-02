const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

async function connectWithMongoMemoryServer() {
  if (!replSet) {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
  }
  return replSet.getUri();
}

async function stopMongoMemoryServer() {
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}

module.exports = {
  connectWithMongoMemoryServer,
  stopMongoMemoryServer,
};
