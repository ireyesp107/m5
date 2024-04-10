global.nodeConfig = {ip: '127.0.0.1', port: 7070};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

const ncdcGroup = {};
const dlibGroup = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   The process that node is
   running in is the actual jest process
*/
let localServer = null;

/*
    The local node will be the orchestrator.
*/

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

beforeAll((done) => {
  /* Stop the nodes if they are running */

  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  dlibGroup[id.getSID(n1)] = n1;
  dlibGroup[id.getSID(n2)] = n2;
  dlibGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const ncdcConfig = {gid: 'ncdc'};
    startNodes(() => {
      groupsTemplate(ncdcConfig).put(ncdcConfig, ncdcGroup, (e, v) => {
        const dlibConfig = {gid: 'dlib'};
        groupsTemplate(dlibConfig).put(dlibConfig, dlibGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});

test('Append on Same Key', (done) => {
  const user = [{first: 'Chay', last: 'Reyes'}];
  const key = 'jcarbsp';

  const user2 = [{first: 'Bob', last: 'Reyes'}];

  distribution.local.store.append(user, key, (e, v) => {
    distribution.local.store.append(user2, key, (e, v) => {
      expect(v).toEqual([{first: 'Bob', last: 'Reyes'},
        {first: 'Chay', last: 'Reyes'}]);
      done();
    });
  });
});
test('Appending Different Keys', (done) => {
  const user = [{first: 'Chay', last: 'Reyes'}];
  const key = 'chays';

  const user2 = [{first: 'Bob', last: 'Reyes'}];
  const key2 = 'bobs';


  distribution.local.store.append(user, key, (e, v) => {
    distribution.local.store.append(user2, key2, (e, v) => {
      distribution.local.store.get(key2, (e, v) => {
        expect(v).toEqual(user2);
        done();

      });
    });
  });
});
test('(0 pts) sample test', () => {
  const t = true;
  expect(t).toBe(true);
});
test('(0 pts) sample test', () => {
  const t = true;
  expect(t).toBe(true);
});
test('(0 pts) sample test', () => {
  const t = true;
  expect(t).toBe(true);
});
