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
    dateStrings : true
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

    session.subscribe('tableNextPosition', (args, kwargs)=>{
        console.log('loaded tableNextPosition', kwargs);
    });

    zongji.on('binlog', function(evt) {
//        evt.dump();
//      console.dir(evt,{depth:null});
//      console.log('-------------------------');

        if ('TableMap' === evt.constructor.name) {
            return;
        }

        const tableName = evt.tableMap[evt.tableId].tableName;

        for (let row of evt.rows) {
            let data = {
                tableName:tableName,
                timestamp:evt.timestamp,
                nextPosition:evt.nextPosition,
            };
    
            if ('UpdateRows' === evt.constructor.name) {
                data.old = row.before;
                data.new = row.after;
                data.operation = 'update';
            } else if ('DeleteRows' === evt.constructor.name) {
                data.old = row;
                data.operation = 'delete';
            } else if ('WriteRows' === evt.constructor.name) {
                data.new = row;
                data.operation = 'insert';
            } else {
                throw 'unknown operation';
            }
            session.publish('table.'+tableName, [], data, {acknowledge:true}).then(()=>{
                session.publish('tableNextPosition', [], {
                    timestamp:evt.timestamp,
                    nextPosition:evt.nextPosition    
                }, {retain:0});
            });
        }
    });

    zongji.start({
      includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
    });

};

connection.open();
