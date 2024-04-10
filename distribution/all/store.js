const id = require('../util/id');
const local = require('../local/local');

let store = (config) => {
  let context = {};
  context.gid = config.gid || 'all'; // Node group ID
  context.hash = config.hash || id.naiveHash; // Hash function
  return {
    put: (value, key, callback) => {
      let groupMap = {};
      local.groups.get(context.gid, (e, v) => {
        groupMap = v;
        let nids = [];
        for (const node in groupMap) {
          if (Object.prototype.hasOwnProperty.call(v, node)) {
            nids.push(id.getNID(groupMap[node]));
          }
        }
        let enhancedKey = {key: key, gid: context.gid};
        const kid = id.getID(enhancedKey.key);
        const targetNID = context.hash(kid, nids);
        const targetNode = groupMap[targetNID.substring(0, 5)];

        if (enhancedKey.key === null) {
          global.distribution[context.gid].comm.send([value, enhancedKey],
              {service: 'store', method: 'put'}, (e, v) => {
                callback({}, Object.values(v).flat());
              });
        } else if (targetNID === id.getNID(global.nodeConfig)) {
          local.store.put([value, enhancedKey], callback);
        } else {
          local.comm.send([value, enhancedKey],
              {node: targetNode, service: 'store', method: 'put'}, callback);
        }
      });
    },
    append: (value, key, callback) => {
      let groupMap = {};
      local.groups.get(context.gid, (e, v) => {
        groupMap = v;
        let nids = [];
        for (const node in groupMap) {
          if (Object.prototype.hasOwnProperty.call(v, node)) {
            nids.push(id.getNID(groupMap[node]));
          }
        }
        let enhancedKey = {key: key, gid: context.gid};
        const kid = id.getID(enhancedKey.key);
        const targetNID = id.consistentHash(kid, nids);
        const targetNode = groupMap[targetNID.substring(0, 5)];

        if (enhancedKey.key === null) {
          global.distribution[context.gid].comm.send([value, enhancedKey],
              {service: 'store', method: 'append'}, (e, v) => {
                callback({}, Object.values(v).flat());
              });
        } else if (targetNID === id.getNID(global.nodeConfig)) {
          local.store.append(value, enhancedKey, callback);
        } else {
          local.comm.send([value, enhancedKey],
              {node: targetNode, service: 'store', method: 'append'}, callback);
        }
      });
    },

    get: (key, callback) => {
      let groupMap = {};
      local.groups.get(context.gid, (e, v) => {
        groupMap = v;

        let nids = [];
        for (const node in groupMap) {
          if (Object.prototype.hasOwnProperty.call(v, node)) {
            nids.push(id.getNID(groupMap[node]));
          }
        }
        let enhancedKey = {key: key, gid: context.gid};

        const kid = id.getID(enhancedKey.key);
        const targetNID = context.hash(kid, nids);
        const targetNode = groupMap[targetNID.substring(0, 5)];
        if (key === null) {
          global.distribution[context.gid].comm.send([enhancedKey],
              {service: 'store', method: 'get'}, (e, v) => {
                callback({}, Object.values(v).flat());
              });
        } else if (targetNID === id.getNID(global.nodeConfig)) {
          local.store.get([enhancedKey], callback);
        } else {
          local.comm.send([enhancedKey],
              {node: targetNode, service: 'store', method: 'get'}, callback);
        }
      });
    },

    del: (key, callback) => {
      let groupMap = {};
      local.groups.get(context.gid, (e, v) => {
        groupMap = v;

        let nids = [];
        for (const node in groupMap) {
          if (Object.prototype.hasOwnProperty.call(v, node)) {
            nids.push(id.getNID(groupMap[node]));
          }
        }
        let enhancedKey = {key: key, gid: context.gid};
        const kid = id.getID(enhancedKey.key);
        const targetNID = context.hash(kid, nids);
        const targetNode = groupMap[targetNID.substring(0, 5)];
        if (targetNode.nid === id.getNID(global.nodeConfig)) {
          local.store.del([enhancedKey], callback);
        } else {
          local.comm.send([enhancedKey],
              {node: targetNode, service: 'store', method: 'del'}, callback);
        }
      });
    },

    reconf: (oldGroupMap, callback) => {
      let groupMap = {};
      local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e);
          return;
        }
        groupMap = v;
        let nids = [];
        for (const node in groupMap) {
          if (Object.prototype.hasOwnProperty.call(v, node)) {
            nids.push(id.getNID(groupMap[node]));
          }
        }
        let enhancedKey = {key: null, gid: context.gid};

        local.store.get(enhancedKey, (err, keys) => {
          if (err) {
            callback(err);
            return;
          }
          let oldNIDs= Object.values(oldGroupMap).map((n) => id.getNID(n));
          keys.forEach((key) => {
            const kid = id.getID(key);
            const oldTargetNID = context.hash(kid, oldNIDs);
            const newTargetNID = context.hash(kid, nids);
            const replaceNode = oldGroupMap[oldTargetNID.substring(0, 5)];
            const newNode = groupMap[newTargetNID.substring(0, 5)];

            let replacedKey = {key: key, gid: context.gid};
            if (oldTargetNID !== newTargetNID) {
              local.comm.send([replacedKey],
                  {node: replaceNode, service: 'store', method: 'get'},
                  (e, v)=>{
                    const replaceObject = v;
                    local.comm.send([replacedKey],
                        {node: replaceNode, service: 'store', method: 'del'},
                        (e, v)=>{
                          local.comm.send([replaceObject, replacedKey],
                              {node: newNode, service: 'store',
                                method: 'put'}, callback);
                        });
                  });
            }
          });
        });
      });
    },
  };
};

module['exports'] = store;
//module['exports'] = store;/* eslint-enable */
