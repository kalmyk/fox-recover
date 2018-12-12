var program = require('commander');
var mysql      = require('mysql');
var autobahn = require('autobahn');

program
    .option('-p, --port <port>', 'Server IP port', 9000)
    .option('-i, --ip <ip>', 'Server IP address','127.0.0.1')
    .parse(process.argv);

var connectUrl = 'ws://' + program.ip + ':' + program.port;
console.log('connectUrl:', connectUrl);

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

var myDB = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'mqrec'
});

function runData(args, kwargs, opts) {
    console.log('Event', opts.topic, 'received args', args, 'kwargs ', kwargs);

    switch(kwargs.operation) {
        case 'insert':
            let fields = [];
            let sfld = '';
            let delim = '';
            for (let f in kwargs.new) {
                fields.push(kwargs.new[f]);
                sfld = sfld + delim + '?';
                delim = ',';
            }
            myDB.query('INSERT INTO `'+kwargs.tableName+'` VALUES ('+sfld+')', fields, function(error, results, fields) {
                if (error) throw error;
            });
            break;
        default:
            console.log('not found');
    } 
}

connection.onopen = function (session) {

    myDB.connect();

    session.subscribe('table.#',runData).then(
        function(subscription) {},
        function(error) {
           console.log("subscription failed", error);
        }
    );

    myDB.query('desc qq;', [], function(error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results);
    });
    
};

connection.open();
