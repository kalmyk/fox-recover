const
  ZongJi = require('zongji'),
  autobahn = require('autobahn');

const
  mysql_pwd = process.env.MYSQL_PWD || 'root',
  mysql_user = process.env.MYSQL_USER || 'root',
  mysql_port = process.env.MYSQL_PORT || 3306,
  mysql_host = process.env.MYSQL_HOST || 'localhost',
  source_db = process.env.SOURCE_DB || 'mqtest',

  mq_url = process.env.MQ_URL || 'ws://foxic.herokuapp.com/wss',
  topic_prefix = process.env.TOPIC_PREFIX || 'table-schema';

console.log('mq_url:', mq_url);

var zongji = new ZongJi({
  host     : mysql_host,
  port     : mysql_port,
  user     : mysql_user,
  password : mysql_pwd,
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
  url: mq_url,
  realm: 'realm1',
  authmethods: ["ticket", "wampcra"],
  authid: user,
  onchallenge: onchallenge
})

process.on('SIGINT', function() {
  console.log('Got SIGINT.');
  zongji.stop();
  process.exit();
})

connection.onopen = function (session) {

  session.subscribe('tableNextPosition', (args, kwargs)=>{
    console.log('loaded tableNextPosition', kwargs);
  });

  zongji.on('binlog', function(evt) {
    // evt.dump();
    // console.dir(evt,{depth:null});
    // console.log('-------------------------');

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
      session.publish(topic_prefix+'.'+tableName, [], data, {acknowledge:true}).then(()=>{
        session.publish('tableNextPosition', [], {
          timestamp:evt.timestamp,
          nextPosition:evt.nextPosition    
        }, {retain:0});
      });
    }
  });

  let includeSchema = {};
  includeSchema[source_db] = true;

  zongji.start({
    includeSchema,
    includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
  });

};

connection.open();
