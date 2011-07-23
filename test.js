
/**
 * Module dependencies.
 */

var should = require('should')
  , redis = require('redis')
  , reds = require('./')
  , db = redis.createClient();

var strs = [];
strs.push('Tobi wants four dollars');
strs.push('Tobi only wants $4');
strs.push('Loki is really fat');
strs.push('Loki, Jane, and Tobi are ferrets');

strs.forEach(function(str){
  var map = reds.metaphoneMap(str);
  for (var word in map) {
    db.sadd('word:' + map[word], word);
  }
});

var query = 'Tobi'
  , arr = reds.metaphoneKeys(query);
console.log(arr);