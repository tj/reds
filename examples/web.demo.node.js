const   
  argv      = require('yargs')                                    // command line handling
              .demand('connection')                               // require the 'connection' argument (this is a node_redis connection object in JSON Format)
              .argv,
  redsearch = require('../'),                                     // RedRediSearch, syntax compatible with Reds
  redis     = require('redis'),                                   // node_redis module
  creds     = require(argv.connection),                           // load the JSON specified in the argument
  client    = redis.createClient(creds),                          // create a Redis client with the Node_redis connection object
  express   = require('express'),                                 // simple web server module
  urls      = require('./urls.json'),                             // load the URLs from a JSON file
  app       = express(),                                          // server instance
  port      = 3000;                                               // load demo on http://localhost:3000/

redsearch.setClient(client);                                      // associate the correct client.

redsearch.createSearch('web',{},function(err,search) {            // create the search with at the "web" key
  app.get(                                                        // HTTP Get
    '/search',                                                    // route for /search
    function(req,res,next) {
      search
        .query(req.query.q)                                       // /search?q=[search query]
        .end(function(err, ids){
          if (err) { next(err); } else {                          // error handling
            res.json(                                             // return JSON
              ids.map(function(id){ return urls[id]; })           // this will return all the URLs that match the results
            );
          }
        });
    }
  );

  app
    .use(express.static('static'))                                // server out static files (the form)
    .listen(port,function() {                                     // start at `port`
      console.log('Listening at',port);                           // we're loaded - let the console know
    });
});
