const utils = require('../util/util');

const mr_routes = {

    mrObj: {}, 

    register: function(obj, serviceName, cb) {
        cb = cb || utils.defaultCb;
        if (typeof(serviceName) !== 'string') {
          cb(new Error('Name must be a string'), null);
        } else if (typeof(obj) !== 'object') {
          cb(new Error('Incorrect service argument'), null);
        } else {
          this.mrObj[serviceName] = obj;
          cb(null, serviceName);
        };
      },

    get: function(serviceName, cb) {
        cb = cb || utils.defaultCb;

        if (Object.keys(this.mrObj).includes(serviceName)) {
            cb(null, this.mrObj[serviceName]);
        } else {
            cb(new Error('In mr_routes: service DNE'), null);
        };
    },

    deregister: function(serviceName, cb) {
        cb = cb || utils.defaultCb;
        if (Object.keys(this.mrObj).includes(serviceName)) {
            delete this.mrObj[serviceName];
            cb(null, serviceName);
        } else {
            cb(new Error('specified service DNEt'), null);
        };
    },

};

module.exports = mr_routes;
