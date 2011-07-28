
/**
 * Module dependencies.
 */

var reds = require('../');

var strs = [];
strs.push('Manny is a cat');
strs.push('Luna is a cat');
strs.push('Tobi is a ferret');
strs.push('Loki is a ferret');
strs.push('Jane is a ferret');
strs.push('Jane is bitchy');

var query = process.argv.slice(2).join(' ');
if (!query) throw new Error('query required');

// index them

strs.forEach(function(str, i){
  reds.add(str, i);
});

// query

reds.search(query, function(err, ids){
  if (err) throw err;
  var res = ids.map(function(i){ return strs[i]; });
  console.log();
  console.log('  Search results for "%s"', query);
  res.forEach(function(str){
    console.log('    - %s', str);
  });
  console.log();
  process.exit();
});