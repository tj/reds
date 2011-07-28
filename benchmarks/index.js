
/**
 * Module dependencies.
 */

var uubench = require('uubench')
  , reds = require('../')
  , fs = require('fs');

/**
 * Pad the given string.
 */

function pad(str, width) {
  return Array(width - str.length + 1).join(' ') + str;
}

/**
 * Global suite.
 */

suite = new uubench.Suite({
  start: function(){
    console.log();
  },

  result: function(name, stats){
    var persec = 1000 / stats.elapsed
      , ops = stats.iterations * persec;
    console.log('  \033[90m%s : \033[36m%s \033[90mops/s\033[0m'
      , pad(name, 20)
      , ops | 0);
  },
  
  done: function(){
    console.log();
  }
});

/**
 * Text bodies.
 */

var small = fs.readFileSync('package.json', 'utf8');
var medium = fs.readFileSync('Readme.md', 'utf8');
var large = Array(20).join(medium);

console.log();
console.log('   small: %dkb', (small.length / 1024).toFixed(2));
console.log('  medium: %dkb', (medium.length / 1024).toFixed(2));
console.log('   large: %dkb', (large.length / 1024).toFixed(2));

suite.bench('add() small', function(next){
  reds.add(small, 0, next);
});

suite.bench('add() medium', function(next){
  reds.add(medium, 1, next);
});

suite.bench('add() large', function(next){
  reds.add(large, 2, next);
});

suite.run();