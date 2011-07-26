
/**
 * Module dependencies.
 */

var should = require('should')
  , redis = require('redis')
  , reds = require('./')
  , db = redis.createClient();

// Populate text bodies

var strs = [];
strs.push('Tobi wants four dollars');
strs.push('Tobi only wants $4');
strs.push('Loki is really fat');
strs.push('Loki, Jane, and Tobi are ferrets');
strs.push('Manny is a cat');
strs.push('Luna is a cat');
strs.push('Mustachio is a cat');

strs.forEach(function(str, i){
  reds.add(str, i);
});

// search

reds.search(query = 'Tobi dollars', function(err, ids){
  if (err) throw err;
  console.log('Search results for "%s":', query);
  ids.forEach(function(id){
    console.log('  - %s', strs[id]);
  });
  process.exit(0);
});

