const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const WorkflowRun = require('../models/WorkflowRun');

const modelsMap = {
  users: User,
  workspaces: Workspace,
  documents: Document,
  document_chunks: DocumentChunk,
  chat_threads: ChatThread,
  chat_messages: ChatMessage,
  workflow_runs: WorkflowRun,
};

// In-Memory Database Store (fallback mode)
const memoryStore = {
  users: new Map(),
  workspaces: new Map(),
  documents: new Map(),
  document_chunks: new Map(),
  chat_threads: new Map(),
  chat_messages: new Map(),
  workflow_runs: new Map(),
};

let repositoryMode = 'memory'; // 'mongo' | 'memory'

function setMode(mode) {
  repositoryMode = mode;
  console.log(`[Repository] Active storage mode: ${mode.toUpperCase()}`);
}

function getMode() {
  return repositoryMode;
}

function getMemoryCollection(collection) {
  if (!memoryStore[collection]) {
    memoryStore[collection] = new Map();
  }
  return memoryStore[collection];
}

// Memory filter matching utility
function matchesFilter(item, filter = {}) {
  for (const [key, value] of Object.entries(filter)) {
    if (key === 'id' || key === '_id') {
      const targetId = String(value);
      if (String(item.id || item._id) !== targetId) return false;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.$in && Array.isArray(value.$in)) {
        const itemVal = item[key];
        if (!value.$in.map(String).includes(String(itemVal))) return false;
      } else if (value.$nin && Array.isArray(value.$nin)) {
        const itemVal = item[key];
        if (value.$nin.map(String).includes(String(itemVal))) return false;
      } else if (value.$ne !== undefined) {
        if (item[key] === value.$ne) return false;
      }
    } else if (item[key] !== value) {
      return false;
    }
  }
  return true;
}

// Memory sort utility
function sortItems(items, sort = {}) {
  const sortKeys = Object.entries(sort);
  if (sortKeys.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const [key, direction] of sortKeys) {
      const valA = a[key];
      const valB = b[key];
      if (valA === valB) continue;
      const factor = direction === -1 || direction === 'desc' ? -1 : 1;
      if (valA === undefined || valA === null) return 1 * factor;
      if (valB === undefined || valB === null) return -1 * factor;
      if (valA instanceof Date || valB instanceof Date) {
        return (new Date(valA) - new Date(valB)) * factor;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * factor;
      }
      return (valA > valB ? 1 : -1) * factor;
    }
    return 0;
  });
}

function formatDoc(doc) {
  if (!doc) return null;
  if (typeof doc.toJSON === 'function') {
    return doc.toJSON();
  }
  const item = { ...doc };
  if (!item.id && item._id) {
    item.id = String(item._id);
  }
  return item;
}

const repository = {
  getMode,
  setMode,

  async getAll(collection, filter = {}, sort = {}) {
    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      const mongoFilter = { ...filter };
      if (mongoFilter.id) {
        mongoFilter._id = mongoFilter.id;
        delete mongoFilter.id;
      }
      const docs = await modelsMap[collection].find(mongoFilter).sort(sort).exec();
      return docs.map((d) => formatDoc(d));
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    let items = Array.from(store.values()).filter((item) => matchesFilter(item, filter));
    items = sortItems(items, sort);
    return items.map((item) => ({ ...item }));
  },

  async getById(collection, id) {
    if (!id) return null;
    const strId = String(id);

    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      try {
        const doc = await modelsMap[collection].findById(strId).exec();
        return formatDoc(doc);
      } catch (err) {
        return null;
      }
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    const item = store.get(strId);
    return item ? { ...item } : null;
  },

  async getOne(collection, filter = {}) {
    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      const mongoFilter = { ...filter };
      if (mongoFilter.id) {
        mongoFilter._id = mongoFilter.id;
        delete mongoFilter.id;
      }
      const doc = await modelsMap[collection].findOne(mongoFilter).exec();
      return formatDoc(doc);
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    for (const item of store.values()) {
      if (matchesFilter(item, filter)) {
        return { ...item };
      }
    }
    return null;
  },

  async create(collection, data = {}) {
    const now = new Date();
    const id = data.id || data._id || uuidv4();

    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      const Model = modelsMap[collection];
      const payload = { ...data };
      delete payload.id;
      const doc = new Model(payload);
      await doc.save();
      return formatDoc(doc);
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    const newItem = {
      ...data,
      id: String(id),
      _id: String(id),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    store.set(newItem.id, newItem);
    return { ...newItem };
  },

  async updateById(collection, id, updates = {}) {
    if (!id) return null;
    const strId = String(id);
    const now = new Date();

    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      try {
        const doc = await modelsMap[collection]
          .findByIdAndUpdate(strId, { $set: updates }, { new: true, runValidators: true })
          .exec();
        return formatDoc(doc);
      } catch (err) {
        return null;
      }
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    const existing = store.get(strId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: strId,
      _id: strId,
      updatedAt: now,
    };
    store.set(strId, updated);
    return { ...updated };
  },

  async upsert(collection, filter = {}, createData = {}, updateData = {}) {
    const existing = await this.getOne(collection, filter);
    if (existing) {
      return this.updateById(collection, existing.id, updateData);
    }
    return this.create(collection, { ...filter, ...createData });
  },

  async deleteById(collection, id) {
    if (!id) return false;
    const strId = String(id);

    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      try {
        const res = await modelsMap[collection].findByIdAndDelete(strId).exec();
        return !!res;
      } catch (err) {
        return false;
      }
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    return store.delete(strId);
  },

  async deleteWhere(collection, filter = {}) {
    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      const mongoFilter = { ...filter };
      if (mongoFilter.id) {
        mongoFilter._id = mongoFilter.id;
        delete mongoFilter.id;
      }
      const res = await modelsMap[collection].deleteMany(mongoFilter).exec();
      return res.deletedCount || 0;
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    let deletedCount = 0;
    for (const [id, item] of store.entries()) {
      if (matchesFilter(item, filter)) {
        store.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  },

  async count(collection, filter = {}) {
    if (repositoryMode === 'mongo' && modelsMap[collection]) {
      const mongoFilter = { ...filter };
      if (mongoFilter.id) {
        mongoFilter._id = mongoFilter.id;
        delete mongoFilter.id;
      }
      return modelsMap[collection].countDocuments(mongoFilter).exec();
    }

    // Memory mode
    const store = getMemoryCollection(collection);
    if (!filter || Object.keys(filter).length === 0) {
      return store.size;
    }
    let count = 0;
    for (const item of store.values()) {
      if (matchesFilter(item, filter)) {
        count++;
      }
    }
    return count;
  },
};

module.exports = repository;
