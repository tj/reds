
/**
 * Module dependencies.
 */

var reds = require('../')
  , agent = require('superagent')
  , search = reds.createSearch('webpages')
  , fs = require('fs');

// install local dev deps first:
//   $ npm install -d
// then run
//   $ node examples/web-index

var urls = fs.readFileSync(__dirname + '/urls', 'utf8').split('\n')
  , start = new Date;

// index

var pending = urls.length;

urls.forEach(function(url, i){
  function log(msg) {
    console.log('  \033[90m%s \033[36m%s\033[0m', msg, url);
  }

  log('fetching');
  agent.get(url, function(res){
    var words;

    // strip html tags
    log('stripping tags');
    words = striptags(res.text);

    // index
    log('indexing');
    search.index(words, i, function(err){
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
  process.exit();
}

// lame, dont use me

function striptags(html) {
  return String(html).replace(/<\/?([^>]+)>/g, '');
}
