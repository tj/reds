// this will benchmark reds. The other benchmark (benchmark/index.js) will actually benchmark the package. This is included for comparison purposes.
// to run this you'll need to install the reds module with npm - not included becuase it's not really a dependency
var argv = require('yargs')
    .demand('connection')
    .argv;
var redis = require('redis');
var connectionObj = require(argv.connection);
var reds;
var fs = require('fs');


reds = require('reds');

reds.setClient(redis.createClient(connectionObj));

reds = reds.createSearch('reds');
// test data

var tiny = fs.readFileSync('./node_modules/reds/package.json', 'utf8');
tiny = Array(5).join(tiny);
var small = fs.readFileSync('./node_modules/reds/Readme.md', 'utf8');
var medium = Array(10).join(small);
var large = Array(30).join(medium);

// benchmarks

suite('indexing', function(){
  bench('tiny index', function(done){
    reds.index(tiny, 'reds1234', done);
  });

  bench('small index', function(done){
    reds.index(small, 'reds1234', done);
  });

  bench('medium index', function(done){
    reds.index(medium, 'reds1234', done);
  });

  bench('large', function(done){
    reds.index(large, 'reds1234', done);
  });

  bench('query - one term', function(done){
    reds
      .query('one')
      .end(done);
  });

  bench('query - two terms (and)', function(done){
    reds
      .query('one two')
      .end(done);
  });

  bench('query - two terms (or)', function(done){
    reds
      .query('one two')
      .type('or')
      .end(done);
  });

  bench('query - three terms (and)', function(done){
    reds
      .query('one two three')
      .end(done);
  });

  bench('query - three terms (or)', function(done){
    reds
      .query('one two three')
      .type('or')
      .end(done);
  });

  let rightsAndFreedoms = 'Everyone has the following fundamental freedoms: (a) freedom of conscience and religion;  (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association.';
  bench('query - long (and)', function(done){
    reds
      .query(rightsAndFreedoms)
      .end(done);
  });
  
  bench('query - long (or)', function(done){
    reds
      .query(rightsAndFreedoms)
      .type('or')
      .end(done);
  });

});