// this will benchmark redredisearch. Also included is the comparision benchmark for reds (benchmarks/benchmark.reds.node.js) as to compare the two packages
var argv = require('yargs')
    .demand('connection')                                                   // you need to provide the --connection in the cmd line arguments, it's a path to a JSON file of node_redis connection information
    .argv;
var redis = require('redis');
var connectionObj = require(argv.connection);
var reds;
var client = redis.createClient(connectionObj);
var fs = require('fs');


reds = require('../');

reds.setClient(client);

// test data

var tiny = fs.readFileSync('../package.json', 'utf8');
tiny = Array(5).join(tiny);
var small = fs.readFileSync('../Readme.md', 'utf8');
var medium = Array(10).join(small);
var large = Array(30).join(medium);


suite('indexing', function(){
  var
    search;

  before(function(next) {
    reds.createSearch('redisearch', {}, function(err,redisearch) {
      if (err) { throw err; } 
      search = redisearch;
      next();
    });
  });
  
  bench('tiny index', function(done){
    search.index(tiny, 'redisearch1234', done);
  });

  bench('small index', function(done){
    search.index(small, 'redisearch1234', done);
  });

  bench('medium index', function(done){
    search.index(medium, 'redisearch1234', done);
  });

  bench('large index', function(done){
    search.index(large, 'redisearch1234', done);
  });
  
    bench('query - one term', function(done){
    search
      .query('one')
      .end(done);
  });

  bench('query - two terms (and)', function(done){
    search
      .query('one two')
      .end(done);
  });

  bench('query - two terms (or)', function(done){
    search
      .query('one two')
      .type('or')
      .end(done);
  });

  bench('query - three terms (and)', function(done){
    search
      .query('one two three')
      .end(done);
  });

  bench('query - three terms (or)', function(done){
    search
      .query('one two three')
      .type('or')
      .end(done);
  });

  let rightsAndFreedoms = 'Everyone has the following fundamental freedoms: (a) freedom of conscience and religion;  (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association.';
  bench('query - long (and)', function(done){
    search
      .query(rightsAndFreedoms)
      .end(done);
  });
  
  bench('query - long (or)', function(done){
    search
      .query(rightsAndFreedoms)
      .type('or')
      .end(done);
  });

  bench('query - direct / complex', function(done){
    search
      .query('(dog|cat) (lassie|garfield)')
      .type('direct')
      .end(done);
  });

  after(function() {
    client.quit();
  });
});


