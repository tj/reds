
/**
 * Module dependencies.
 */

var reds = require('../')
  , should = require('should')
  , redis = require('redis')
  , search = reds.createSearch('reds')
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
  .metaphoneKeys('reds', ['foo', 'bar', 'baz'])
  .should.eql(['reds:word:F', 'reds:word:BR', 'reds:word:BS']);

reds
  .metaphoneKeys('foobar', ['foo', 'bar', 'baz'])
  .should.eql(['foobar:word:F', 'foobar:word:BR', 'foobar:word:BS']);


db.flushdb(function(){
  search
    .index('Tobi wants 4 dollars', 0)
    .index('Loki is a ferret', 2)
    .index('Tobi is also a ferret', 3)
    .index('Jane is a bitchy ferret', 4)
    .index('Tobi is employed by LearnBoost', 5, test)
    .index('computing stuff', 6);
});

function test() {
  var pending = 0;

  ++pending;
  search
    .query('stuff compute', function(err, ids){
      if (err) throw err;
      ids.should.eql([6]);
      --pending || done();
    });

  ++pending;
  search
    .query('Tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  search
    .query('tobi', function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  search
    .query('bitchy', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  search
    .query('bitchy jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  search
    .query('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    }, 'or');

  ++pending;
  search
    .query('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    }, 'or');

  ++pending;
  search
    .query('loki and jane', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    }, 'and');

  ++pending;
  search
    .query('jane ferret', function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    }, 'and');

  ++pending;
  search
    .query('is a', function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    });

  ++pending;
  search
    .index('keyboard cat', 6, function(err){
      if (err) throw err;
      search.query('keyboard', function(err, ids){
        if (err) throw err;
        ids.should.eql([6]);
        search.query('cat', function(err, ids){
          if (err) throw err;
          ids.should.eql([6]);
          search.remove(6, function(err){
            if (err) throw err;
            search.query('keyboard', function(err, ids){
              if (err) throw err;
              ids.should.be.empty;
              search.query('cat', function(err, ids){
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