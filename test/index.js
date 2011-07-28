
/**
 * Module dependencies.
 */

var reds = require('../')
  , should = require('should')
  , redis = require('redis')
  , db = redis.createClient();

var start = new Date;

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
  .should.eql(['reds:word:F', 'reds:word:BR', 'reds:word:BS']);

db.flushdb(function(){
  reds
    .add('Tobi wants 4 dollars', 0)
    .add('Loki is a ferret', 2)
    .add('Tobi is also a ferret', 3)
    .add('Jane is a bitchy ferret', 4)
    .add('Tobi is employed by LearnBoost', 5, test)
    .add('computing stuff', 6);
});

function test() {
  var pending = 0;

  ++pending;
  reds
    .search('stuff compute', function(err, ids){
      if (err) throw err;
      ids.should.eql([6]);
      --pending || done();
    });

  ++pending;
  reds
    .search('Tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  reds
    .search('tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  reds
    .search('bitchy', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  reds
    .search('bitchy jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    });

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    }, 'or');

  ++pending;
  reds
    .search('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    }, 'and');

  ++pending;
  reds
    .search('jane ferret', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    }, 'and');

  ++pending;
  reds
    .search('is a', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    });

  ++pending;
  reds.
    add('keyboard cat', 6, function(err){
      if (err) throw err;
      reds.search('keyboard', function(err, ids){
        if (err) throw err;
        ids.should.eql([6]);
        reds.search('cat', function(err, ids){
          if (err) throw err;
          ids.should.eql([6]);
          reds.remove(6, function(err){
            if (err) throw err;
            reds.search('keyboard', function(err, ids){
              if (err) throw err;
              ids.should.be.empty;
              reds.search('cat', function(err, ids){
                if (err) throw err;
                ids.should.be.empty;
                --pending || done();
              });
            });
          });
        });
      });
    });
}

function done() {
  console.log();
  console.log('  tests completed in %dms', new Date - start);
  console.log();
  process.exit();
}