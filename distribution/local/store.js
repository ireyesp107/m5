
const fs = require('fs');
const path = require('path');
const serialization = require('../util/serialization');
const id = require('../util/id');
const defaultGID = 'local';


const baseDir = path.join(__dirname,
    '..', '..', 'store'+'/'+global.nodeConfig.port);
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, {recursive: true});
}


const store = {
  put: (object, key, callback) => {
    let newKey; let gid;
    if (typeof key === 'object' && key !== null) {
      newKey = key.key;
      gid = key.gid;
    } else {
      newKey = key;
      gid = defaultGID; // Use default gid if none provided
    }

    const formattedKey = newKey !== null ?
      newKey : id.getID(object);
    const gidDirectory = path.join(baseDir, gid);
    if (!fs.existsSync(gidDirectory)) {
      fs.mkdirSync(gidDirectory, {recursive: true});
    }
    const filePath = path.join(gidDirectory, `${formattedKey}.json`);
    const serializedObject = serialization.serialize(object);

    fs.writeFile(filePath, serializedObject, (err) => {
      callback(err, object);
    });
  },

  append: (object, key, callback) =>{
    let newKey; let gid;
    if (typeof key === 'object' && key !== null) {
      newKey = key.key;
      gid = key.gid;
    } else {
      newKey = key;
      gid = defaultGID; // Use default gid if none provided
    }

    const gidDirectory = path.join(baseDir, gid);
    if (!fs.existsSync(gidDirectory)) {
      fs.mkdirSync(gidDirectory, {recursive: true});
    }

    const nodeFile = path.join(gidDirectory, `${newKey}.json`);
    if (fs.existsSync(nodeFile)) {
      let tempData = fs.readFileSync(nodeFile, {encoding: 'utf8'});
      tempData = serialization.deserialize(tempData);
      object = [...object, ...tempData];
    }
    fs.appendFileSync(nodeFile,
        serialization.serialize(object), {encoding: 'utf8', flag: 'w'});
    callback(null, null);
  },

  get: (key, callback) => {
    let newKey; let gid;
    if (typeof key === 'object' && key !== null) {
      newKey = key.key;
      gid = key.gid;
    } else {
      newKey = key;
      gid = defaultGID; // Use default gid if none provided
    }
    if (newKey === null) {
      const gidDirectory = path.join(baseDir, gid);

      fs.readdir(gidDirectory, (err, files) => {
        if (err) {
          callback(err, null);
          return;
        }
        let returnKeys =[];
        files.forEach((file)=> {
          returnKeys.push(path.basename(file,
              '.json'));
        });
        callback(null, returnKeys);
      });
    } else {
      const formattedKey = newKey;
      const gidDirectory = path.join(baseDir, gid);
      const filePath = path.join(gidDirectory, `${formattedKey}.json`);
      // const filePath = path.join(baseDir, `${formattedKey}.json`);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          callback(new Error('Object not found'), null);
          return;
        }
        const object = serialization.deserialize(data.toString());
        callback(null, object);
      });
    }
  },


  del: (key, callback) => {
    let newKey; let gid;
    if (typeof key === 'object' && key !== null) {
      newKey = key.key;
      gid = key.gid;
    } else {
      newKey = key;
      gid = defaultGID; // Use default gid if none provided
    }
    const formattedKey = newKey;
    const gidDirectory = path.join(baseDir, gid);
    const filePath = path.join(gidDirectory, `${formattedKey}.json`);
    // const filePath = path.join(baseDir, `${fortmattedKey}.json`);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        callback(new Error('Object does not exist'), null);
      } else {
        fs.unlink(filePath, (delErr) => {
          if (delErr) {
            callback(new Error('Failed to delete object'), null);
          } else {
            const object = serialization.deserialize(data.toString());
            callback(null, object);
          }
        });
      }
    });
  },
};
module['exports'] = store;

// module[_0x7ef69b(0x188)] = store;/* eslint-enable */
