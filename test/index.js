
/**
 * Module dependencies.
 */

var reds = require('../')
  , should = require('should')
  , redis = require('redis')
  , db = redis.createClient();

reds.version.should.match(/^\d+\.\d+\.\d+$/);

reds
  .words('foo bar baz')
  .should.eql(['foo', 'bar', 'baz']);

reds
  .stripStopWords(['this', 'is', 'just', 'a', 'test'])
  .should.eql(['just', 'test']);

reds
  .metaphoneMap(['foo', 'bar', 'baz'])
  .should.eql({
      foo: 'F'
    , bar: 'BR'
    , baz: 'BS'
  });

reds
  .metaphoneArray(['foo', 'bar', 'baz'])
  .should.eql(['F', 'BR', 'BS'])

reds
  .metaphoneKeys(['foo', 'bar', 'baz'])
  .should.eql(['word:F', 'word:BR', 'word:BS']);

db.flushdb(function(){
  reds
    .add('Tobi wants 4 dollars', 0)
    .add('Loki is a ferret', 2)
    .add('Tobi is also a ferret', 3)
    .add('Jane is a bitchy ferret', 4)
    .add('Tobi is employed by LearnBoost', 5, test);
});

function test() {
  var pending = 0;

  ++pending;
  reds
    .search('Tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || process.exit();
    });

  ++pending;
  reds
    .search('tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || process.exit();
    });

  ++pending;
  reds
    .search('bitchy', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || process.exit();
    });

  ++pending;
  reds
    .search('bitchy jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || process.exit();
    });

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || process.exit();
    });

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || process.exit();
    }, 'or');

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || process.exit();
    }, 'and');

  ++pending;
  reds
    .search('jane ferret', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || process.exit();
    }, 'and');

  ++pending;
  reds
    .search('is a', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || process.exit();
    });
}