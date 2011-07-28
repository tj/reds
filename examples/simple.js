
/**
 * Module dependencies.
 */

var reds = require('../')
  , search = reds.createSearch('pets');

// $ node examples/simple Tobi
// $ node examples/simple tobi
// $ node examples/simple cat
// $ node examples/simple bitch
// $ node examples/simple bitch ferret

var strs = [];
strs.push('Manny is a cat');
strs.push('Luna is a cat');
strs.push('Tobi is a ferret');
strs.push('Loki is a ferret');
strs.push('Jane is a ferret');
strs.push('Jane is bitchy ferret');

var query = process.argv.slice(2).join(' ');
if (!query) throw new Error('query required');

// index them

strs.forEach(function(str, i){
  search.index(str, i);
});

// query

search.query(query).end(function(err, ids){
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