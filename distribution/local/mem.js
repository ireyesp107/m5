const id = require('../util/id');
let myMap = {}; // In-memory myMap
const defaultGID = 'local';

function getStorageMap(gid = defaultGID) {
  if (!myMap[gid]) {
    myMap[gid] = {}; // Initialize a new map for this gid if it doesn't exist
  }
  return myMap[gid];
}

const mem = {
  // myMap: {},
  put: (obj, key, callback) => {
    let formattedKey; let gid;
    if (typeof key === 'object' && key !== null) {
      formattedKey = key.key;
      gid = key.gid;
    } else {
      formattedKey = key;
      gid = defaultGID; // Use default gid if none provided
    }
    const serializedKey = formattedKey !== null ? formattedKey : id.getID(obj);
    const map = getStorageMap(gid);

    map[serializedKey] = obj;
    if (typeof callback === 'function') {
      callback(null, obj);
    }
  },

  get: (key, callback) => {
    let formattedKey; let gid;
    if (typeof key === 'object' && key !== null) {
      formattedKey = key.key;
      gid = key.gid;
    } else {
      formattedKey = key;
      gid = defaultGID;
    }

    if (formattedKey === null) {
      const allKeys = [];
      const mapValues = Object.values(myMap);

      for (const groupMap of mapValues) {
        const keys = Object.keys(groupMap);
        for (const key of keys) {
          allKeys.push(key);
        }
      }
      if (typeof callback === 'function') {
        callback(null, allKeys);
      }
    } else {
      const map = getStorageMap(gid);
      const storedObject = map[formattedKey];
      if (storedObject !== undefined) {
        callback(null, storedObject);
      } else {
        callback(new Error('Object not found'), null);
      }
    }
  },
  append: (obj, key, callback) => {
    let formattedKey; let gid;
    if (typeof key === 'object' && key !== null) {
      formattedKey = key.key;
      gid = key.gid;
    } else {
      formattedKey = key;
      gid = defaultGID; // Use default gid if none provided
    }
    const serializedKey = formattedKey !== null ? formattedKey : id.getID(obj);
    const map = getStorageMap(gid);

    if (map.hasOwnProperty(serializedKey)) {
      if (!Array.isArray(map[serializedKey])) {
        map[serializedKey] = [map[serializedKey]];
      }
      if (Array.isArray(obj)) {
        map[serializedKey] = [...map[serializedKey], ...obj];
      } else {
        map[serializedKey].push(obj);
      }
    } else {
      map[serializedKey] = Array.isArray(obj) ? obj : [obj];
    }

    if (typeof callback === 'function') {
      callback(null, map[serializedKey]);
    }
  },

  del: (key, callback) => {
    let formattedKey; let gid;
    if (typeof key === 'object' && key !== null) {
      formattedKey = key.key;
      gid = key.gid;
    } else {
      formattedKey = key;
      gid = defaultGID;
    }

    const map = getStorageMap(gid);
    if (map.hasOwnProperty(formattedKey)) {
      const object = map[formattedKey];
      delete map[formattedKey];
      if (typeof callback === 'function') {
        callback(null, object);
      }
    } else {
      callback(new Error('No Object Exists'), null);
    }
  },
};
module['exports'] = mem;

