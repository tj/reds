
/**
 * Module dependencies.
 */

var uubench = require('uubench')
  , reds = require('../').createSearch('reds')
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

var tiny = fs.readFileSync('package.json', 'utf8');
tiny = Array(5).join(tiny);
var small = fs.readFileSync('Readme.md', 'utf8');
var medium = Array(10).join(small);
var large = Array(30).join(medium);

console.log();
console.log('    tiny: %dkb', (tiny.length / 1024).toFixed(2));
console.log('   small: %dkb', (small.length / 1024).toFixed(2));
console.log('  medium: %dkb', (medium.length / 1024).toFixed(2));
console.log('   large: %dmb', (large.length / 1024 / 1024).toFixed(2));

suite.bench('index() tiny', function(next){
  reds.index(tiny, 0, next);
});

// suite.bench('index() small', function(next){
//   reds.index(small, 0, next);
// });

// suite.bench('index() medium', function(next){
//   reds.index(medium, 1, next);
// });

// suite.bench('index() large', function(next){
//   reds.index(large, 2, next);
// });

suite.run();