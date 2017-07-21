const   
  argv      = require('yargs')                                    // command line handling
              .demand('connection')                               // require the 'connection' argument (this is a node_redis connection object in JSON Format)
              .argv,
  redsearch = require('../'),                                     // RedRediSearch, syntax compatible with Reds
  redis     = require('redis'),                                   // node_redis module
  request   = require('request'),                                 // Get a remote URL
  creds     = require(argv.connection),                           // load the JSON specified in the argument
  client    = redis.createClient(creds),                          // create a Redis client with the Node_redis connection object
  urls      = require('./urls.json'),                             // load the URLs from a JSON file
  start     = new Date;                                           // for calculating time of index

function striptags(html) {                                        // quick and dirty, don't reuse ("Lame" according to TJ)
  return String(html).replace(/<\/?([^>]+)>/g, '');
}

redsearch.setClient(client);                                      // associate the correct client.

redsearch.createSearch('web',{},function(err,search) {            // create the search with at the "web" key
  var pending = urls.length;

  urls.forEach(function(url, i){                                  // over each URL
      function log(msg) {                                         // logging for this specific URL
        console.log(
          '  \033[90m%s \033[36m%s\033[0m', msg, url
        );
      }
      log('fetching');

      request(url, function(err, res, body){
        if (err) throw err;                                       // error 'handling'
        var words = striptags(body);                              // strip html tags

        log('indexing');
        search.index(words, i, function(err){                     // words are being indexed and the ID is just a number here
          if (err) throw err;
          log('completed');
          --pending || done();                                    // if pending drops to 0 then call done.
        });
      });
    });

  // all done

  function done() {                                               // wrap up
    console.log('  indexed %d pages in %ds'
      , urls.length
      , ((new Date - start) / 1000).toFixed(2));
    client.quit();
  }
});