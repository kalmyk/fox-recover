var program = require('commander');
var ZongJi = require('zongji');
var autobahn = require('autobahn');

program
    .option('-p, --port <port>', 'Server IP port', 9000)
    .option('-i, --ip <ip>', 'Server IP address','127.0.0.1')
    .parse(process.argv);

var connectUrl = 'ws://' + program.ip + ':' + program.port;
console.log('connectUrl:', connectUrl);

var zongji = new ZongJi({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  // debug: true
});

// this callback is fired during authentication
function onchallenge (session, method, extra) {
    if (method === "ticket") {
        return key;
    } else {
        throw "don't know how to authenticate using '" + method + "'";
    }
}

var user = "joe";
var key = "joe-secret";

var connection = new autobahn.Connection({
    url: connectUrl,
    realm: 'realm1',
    authmethods: ["ticket", "wampcra"],
    authid: user,
    onchallenge: onchallenge
});

process.on('SIGINT', function() {
  console.log('Got SIGINT.');
  zongji.stop();
  process.exit();
});

connection.onopen = function (session) {

    zongji.on('binlog', function(evt) {
      evt.dump();
    //  console.log(evt);

      console.log('-------------------------', evt.rows, evt.tableMap[evt.tableId].tableName);

      session.publish('table.'+evt.tableMap[evt.tableId].tableName, [], {rows:evt.rows}, { acknowledge : false });
    });

    zongji.start({
      includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
    });

};

connection.open();
