const   
  argv      = require('yargs')                                    // command line handling
              .demand('connection')                               // require the 'connection' argument
              .demand('query')                                    // the query we'll run against the indexed values
              .argv,
  redsearch = require('../'),                                     // RedRediSearch, syntax compatible with Reds
  redis     = require('redis'),                                   // node_redis module
  creds     = require(argv.connection),                           // load the JSON specified in the argument
  client    = redis.createClient(creds);                          // create a Redis client with the Node_redis connection object

redsearch.setClient(client);                                      // associate the correct client.

redsearch.createSearch('pets', {}, function(err,search) {
  // $ node examples/simple --connection /path/to/connection/object/json --query tobi
  // $ node examples/simple --connection /path/to/connection/object/json --query tobi
  // $ node examples/simple --connection /path/to/connection/object/json --query cat
  // $ node examples/simple --connection /path/to/connection/object/json --query fun
  // $ node examples/simple --connection /path/to/connection/object/json --query "funny ferret"

  var strs = [];
  strs.push('Manny is a cat');
  strs.push('Luna is a cat');
  strs.push('Tobi is a ferret');
  strs.push('Loki is a ferret');
  strs.push('Jane is a ferret');
  strs.push('Jane is funny ferret');

  // index them

  strs.forEach(function(str, i){
    search.index(str, i);
  });

  // query

  search.query(argv.query).end(function(err, ids){
    if (err) throw err;
    var res = ids.map(function(i){ return strs[i]; });
    console.log();
    console.log('  Search results for "%s"', argv.query);
    res.forEach(function(str){
      console.log('    - %s', str);
    });
    console.log();
    process.exit();
  });
});
