
/**
 * Module dependencies.
 */

var reds = require('../')
  , agent = require('superagent');

// install local dev deps first:
//   $ npm install -d
// then run
//   $ node examples/web-index

var urls = []
  , start = new Date;

urls.push('http://learnboost.com');
urls.push('http://manning.com');

// index

var pending = urls.length;

urls.forEach(function(url, i){
  function log(msg) {
    console.log('  \033[90m%s \033[36m%s\033[0m', msg, url);
  }

  log('fetching');
  agent.get(url, function(err, res, body){
    if (err) throw err;
    // strip html tags
    log('stripping tags');
    body = striptags(body);

    // index
    log('indexing');
    reds.add(body, i, function(err){
      if (err) throw err;
      log('completed');
      --pending || done();
    });
  });
});

// all done

function done() {
  console.log('  indexed %d pages in %ds'
    , urls.length
    , ((new Date - start) / 1000).toFixed(2));
}

// lame, dont use me

function striptags(html) {
  return String(html).replace(/<\/?([^>]+)>/g, '');
}