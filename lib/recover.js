const
  mysql    = require('mysql'),
  autobahn = require('autobahn');

const
  mysql_pwd = process.env.MYSQL_PWD || 'root',
  mysql_user = process.env.MYSQL_USER || 'root',
  mysql_port = process.env.MYSQL_PORT || 3306,
  mysql_host = process.env.MYSQL_HOST || 'localhost',
  connect_url = process.env.URL || 'ws://foxic.herokuapp.com/wss',
  table_prefix = process.env.PREFIX || 'table-schema';

console.log('connect_url:', connect_url);

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

let connection = new autobahn.Connection({
  url: connect_url,
  realm: 'realm1',
  authmethods: ["ticket", "wampcra"],
  authid: user,
  onchallenge: onchallenge
});

let myDB = mysql.createConnection({
  host     : mysql_host,
  port     : mysql_port,
  user     : mysql_user,
  password : mysql_pwd,
  database : 'mqrec'
});

let tableDictionary = {}; 

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
        if (error)
          console.log(error);
      });
      break;
    case 'update':
      if (!tableDictionary.hasOwnProperty(kwargs.tableName)) {
        console.log('get dictionary', kwargs.tableName);
        
        myDB.query('desc `'+kwargs.tableName+'`;', [], function(error, results, fields) {
          if (error) throw error;
          console.log('table desc: ', results);
        });
        
      }
      break;
    default:
        console.log('operation not found', kwargs.operation);
  } 
}

connection.onopen = function (session) {

  myDB.connect();

  session.subscribe(table_prefix+'.#',runData).then(
    function(subscription) {},
    function(error) {
      console.log("subscription failed", error);
    }
  );

};

connection.open();
