
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
    .query('stuff compute')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([6]);
      --pending || done();
    });

  ++pending;
  search
    .query('Tobi')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  search
    .query('tobi')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([0, 3, 5]);
      --pending || done();
    });

  ++pending;
  search
    .query('bitchy')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  search
    .query('bitchy jane')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  search
    .query('loki and jane')
    .type('or')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    });

  ++pending;
  search
    .query('loki and jane')
    .type('or')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([2, 4]);
      --pending || done();
    });

  ++pending;
  search
    .query('loki and jane')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    });

  ++pending;
  search
    .query('jane ferret')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([4]);
      --pending || done();
    });

  ++pending;
  search
    .query('is a')
    .end(function(err, ids){
      if (err) throw err;
      ids.should.eql([]);
      --pending || done();
    });

  ++pending;
  search
    .index('keyboard cat', 6, function(err){
      if (err) throw err;
      search.query('keyboard').end(function(err, ids){
        if (err) throw err;
        ids.should.eql([6]);
        search.query('cat').end(function(err, ids){
          if (err) throw err;
          ids.should.eql([6]);
          search.remove(6, function(err){
            if (err) throw err;
            search.query('keyboard').end(function(err, ids){
              if (err) throw err;
              ids.should.be.empty;
              search.query('cat').end(function(err, ids){
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