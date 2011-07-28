
/**
 * Module dependencies.
 */

var reds = require('../')
  , fs = require('fs')
  , search = reds.createSearch('webpages')
  , urls = fs.readFileSync(__dirname + '/urls', 'utf8').split('\n');

// First run:
//   $ node examples/web-index
// Then query:
//   $ node examples/web-search whatever query here
//   $ node examples/web-search jade
//   $ node examples/web-search education
//   $ node examples/web-search learnboost
//   $ node examples/web-search mongodb

var query = process.argv.slice(2).join(' ');
if (!query) throw new Error('query required');

// query

search.query(query).end(function(err, ids){
  if (err) throw err;
  var res = ids.map(function(i){ return urls[i]; });
  console.log();
  console.log('  Search results for "%s"', query);
  res.forEach(function(str){
    console.log('    - %s', str);
  });
  console.log();
  process.exit();
});