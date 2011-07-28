
/**
 * Module dependencies.
 */

var http = require('http')
  , reds = require('../')
  , search = reds.createSearch('webpages')
  , parse = require('url').parse
  , qs = require('querystring')
  , fs = require('fs');

// urls, could be in redis or another db

var urls = fs.readFileSync(__dirname + '/urls', 'utf8').split('\n');

// First run:
//    $ node examples/web-index

http.createServer(function(req, res){
  var url = parse(req.url)
    , query = qs.parse(url.query);

  if ('/search' == url.pathname) {
    search.query(query.q).end(function(err, ids){
      // ids are simply indexes in this case
      var json = JSON.stringify(ids.map(function(id){ return urls[id]; }));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', json.length);
      res.end(json);
    });
  } else {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname + '/form.html', 'utf8', function(err, buf){
      res.end(buf);
    });
  }
}).listen(3000);

console.log('App started on port 3000');