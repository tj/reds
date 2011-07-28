
/**
 * Module dependencies.
 */

var reds = require('../')
  , agent = require('superagent');

// install local dev deps first:
//   $ npm install -d

var urls = [];

urls.push('http://learnboost.com');

// index

var pending = urls.length;

urls.forEach(function(url, i){
  console.log('  fetching %s', url);
  agent.get(url, function(err, res, body){
    if (err) throw err;
    // strip html tags
    console.log('  stripping tags %s', url);
    body = striptags(body);

    console.log('  indexing %s', url);
    reds.add(body, i, function(err){
      if (err) throw err;
      console.log('  completed %s', url);
    });
  });
});

// lame, dont use me

function striptags(html) {
  return String(html)
    .replace(/<\/?([^>]+)>/g, '');
}