
/**
 * Module dependencies.
 */
var argv = require('yargs')
    .demand('connection')
    .argv;
var redis = require('redis');
var connectionObj = require(argv.connection);
var reds;
var fs = require('fs');


reds = require('../');

reds.setClient(redis.createClient(connectionObj));

reds = reds.createSearch('reds');
// test data

var tiny = fs.readFileSync('package.json', 'utf8');
tiny = Array(5).join(tiny);
var small = fs.readFileSync('Readme.md', 'utf8');
var medium = Array(10).join(small);
var large = Array(30).join(medium);

// benchmarks

suite('indexing', function(){
  bench('tiny', function(done){
    reds.index(tiny, '1234', done);
  });

  bench('small', function(done){
    reds.index(small, '1234', done);
  });

  bench('medium', function(done){
    reds.index(medium, '1234', done);
  });

  bench('large', function(done){
    reds.index(large, '1234', done);
  });
});