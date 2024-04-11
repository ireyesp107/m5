const utils = require('../util/util');
const local = require('../local/local');

const mr = function(config) {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    exec: (configuration, callback) => {
      const mapPhase = function(obj, config, gid, serviceName, cb) {
        global.distribution.local.store.get({key: null, gid: gid},
            (e, storeKeys) => {
              const keysLength = storeKeys.length;
              let arrayObjs = [];
              let mapObjs = new Map();
              let storeOrMem = 'store';
              if (Object.keys(config).includes('memory') && config['memory']) {
                storeOrMem = 'mem';
              };
              storeKeys.forEach((localKey) => {
                global.distribution.local.store.get({key: localKey, gid: gid},
                    (e, localValue) =>{
                      mapObjs[localKey]=config.map(localKey, localValue);
                      arrayObjs.push(config.map(localKey, localValue));
                      if (keysLength === arrayObjs.length) {
                        global.distribution.local[storeOrMem].put(mapObjs,
                            {key: 'mapPhaseMap', gid: gid}, (e, v)=>{
                              cb(null, v);
                            });
                      }
                    });
              });
            });
      };

      const shufflePhase = function(obj, config, gid, serviceName, cb) {
        let storeOrMem = 'store';
        if (Object.keys(config).includes('memory') && config['memory']) {
          storeOrMem = 'mem';
        };
        global.distribution.local[storeOrMem].get(
            {key: 'mapPhaseMap', gid: gid},
            (e, v)=>{
              const foundPairs = new Map();
              for (let key in v) {
                if (v.hasOwnProperty(key)) {
                  if (Array.isArray(v[key])) {
                    for (let i = 0; i < v[key].length; i++) {
                      const word = Object.keys(v[key][i])[0];
                      const count =v[key][i][word];

                      if (!foundPairs.has(word)) {
                        foundPairs.set(word, []);
                      }
                      foundPairs.get(word).push(count);
                    }
                  } else {
                    const mykey = Object.keys(v[key])[0];
                    const myValue =v[key][mykey];
                    if (!foundPairs.has(mykey)) {
                      foundPairs.set(mykey, []);
                    }
                    foundPairs.get(mykey).push(myValue);
                  }
                }
              }
              let numGroupPairs = foundPairs.size;
              let counter = 0;

              for (const groupKey of foundPairs.keys()) {
                let currentGroup = foundPairs.get(groupKey);
                let newGroupKey = groupKey+serviceName;
                global.distribution[gid][storeOrMem].append(currentGroup,
                    newGroupKey, (e, v) =>{
                      counter +=1;
                      if (counter === numGroupPairs) {
                        cb(null, v);
                      }
                    });
              }
            });
      };

      // reduce phase
      const reducePhase = function(obj, config, gid, serviceName, cb) {
        let storeOrMem = 'store';
        if (Object.keys(config).includes('memory') && config['memory']) {
          storeOrMem = 'mem';
        };
        global.distribution.local[storeOrMem].get(
            {key: null, gid: gid}, (e, v) =>{
              const keysInPossession = [];
              for (let key of v) {
                if (key.endsWith(serviceName)) {
                  keysInPossession.push(key);
                }
              }
              const reducePairs =[];
              if (keysInPossession.length>0) {
                keysInPossession.forEach((foundKey)=>{
                  global.distribution.local[storeOrMem].get(
                      {key: foundKey, gid: gid},
                      (e, values) =>{
                        reducePairs.push(
                            config.reduce(foundKey.slice(0,
                                -serviceName.length),
                            values));
                        if (reducePairs.length === keysInPossession.length) {
                          cb(null, reducePairs);
                        }
                      });
                });
              } else {
                cb(null, keysInPossession);
              }
            });
      };
      const deregisterFunc = function(serviceName) {
        local.mr_routes.deregister(serviceName,
            (e, v) => {
              remote = {service: 'mr_routes',
                method: 'deregister'};
              global.distribution[context.gid].comm.send(
                  [serviceName], remote, (e, v) => {
                    return;
                  });
            });
      };


      let serviceName = 'mr-'+utils.id.getID(configuration).substring(0, 10);

      // configuration.memory = true;
      let endpointService = {'mapPhase': mapPhase,
        'shufflePhase': shufflePhase,
        'reducePhase': reducePhase};

      // register the current MR locally
      local.mr_routes.register(endpointService, serviceName, (e, v) => {
        console.log('REGISTER: '+v);
      });

      // add mr_routes to whole node group
      let remote = {service: 'routes', method: 'put'};
      let mrRoutes = global.distribution.local.mr_routes;


      global.distribution[context.gid].comm.send([mrRoutes, 'mr_routes'],
          remote, (e, v) => {
            remote = {service: 'mr_routes', method: 'register'};
            global.distribution[context.gid].comm.send(
                [endpointService, serviceName], remote, (e, v) => {
                // map phase
                  let keyObj = {key: null, gid: context.gid};
                  remote = {'service': serviceName, 'method': 'mapPhase'};
                  global.distribution[context.gid].comm.send(
                      [keyObj, configuration, context.gid, serviceName],
                      remote, (e, v) => {
                      // shuffle phase
                        remote.method = 'shufflePhase';
                        global.distribution[context.gid].comm.send([keyObj,
                          configuration, context.gid, serviceName],
                        remote, (e, v) => {
                        // reduce phase
                          remote.method = 'reducePhase';
                          global.distribution[context.gid].comm.send(
                              [keyObj, configuration, context.gid,
                                serviceName], remote, (e, v) => {
                                const result = Object.values(v).reduce(
                                    (acc, val) => acc.concat(val), []);
                                callback(null, result);
                                deregisterFunc(serviceName);
                              });
                        });
                      });
                });
          });
    },
  };
};

module.exports = mr;
