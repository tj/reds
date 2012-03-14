
/**
 * Module dependencies.
 */

var reds = require('../')
  , should = require('should')
  , redis = require('redis')
  , search = reds.createSearch('reds')
  , db = redis.createClient();

var start = new Date;

describe('.version', function(){
  it('should be exposed', function(){
    reds.version.should.match(/^\d+\.\d+\.\d+$/);
  })
})

describe('.words(str)', function(){
  it('should parse words', function(){
    reds
      .words('foo bar baz')
      .should.eql(['foo', 'bar', 'baz']);
  })
})

describe('.stripStopWords(arr)', function(){
  it('should strip the stop words', function(){
    reds
      .stripStopWords(['this', 'is', 'just', 'a', 'test'])
      .should.eql(['just', 'test']);
  })
})

describe('.metaphoneMap(arr)', function(){
  it('should return the metaphone map', function(){
    reds
      .metaphoneMap(['foo', 'bar', 'baz'])
      .should.eql({
          foo: 'F'
        , bar: 'BR'
        , baz: 'BS'
      });
  })
})

describe('.metaphoneArray(arr)', function(){
  it('should return the metaphone array', function(){
    reds
      .metaphoneArray(['foo', 'bar', 'baz'])
      .should.eql(['F', 'BR', 'BS']);
  })
})

describe('.metaphoneKeys(key, arr)', function(){
  it('should return redis metaphone keys', function(){
    reds
      .metaphoneKeys('reds', ['foo', 'bar', 'baz'])
      .should.eql(['reds:word:F', 'reds:word:BR', 'reds:word:BS']);

    reds
      .metaphoneKeys('foobar', ['foo', 'bar', 'baz'])
      .should.eql(['foobar:word:F', 'foobar:word:BR', 'foobar:word:BS']);
  })
})

describe('.index(string, id)', function(){
  it('should index the strings', function(done){
    db.flushdb(function(){
      search
        .index('Tobi wants 4 dollars', 0)
        .index('Loki is a ferret', 2)
        .index('Tobi is also a ferret', 3)
        .index('Jane is a bitchy ferret', 4)
        .index('Tobi is employed by LearnBoost', 5)
        .index('computing stuff', 6, done);
    });
  })
})

describe('.search(query)', function(){
  it('should perform the search', function(done){
    var pending = 0;

    ++pending;
    search
      .query('stuff compute')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.eql(['6']);
        --pending || done();
      });

    ++pending;
    search
      .query('Tobi')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.have.length(3);
        ids.should.include('0');
        ids.should.include('3');
        ids.should.include('5');
        --pending || done();
      });

    ++pending;
    search
      .query('tobi')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.have.length(3);
        ids.should.include('0');
        ids.should.include('3');
        ids.should.include('5');
        --pending || done();
      });

    ++pending;
    search
      .query('bitchy')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.eql(['4']);
        --pending || done();
      });

    ++pending;
    search
      .query('bitchy jane')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.eql(['4']);
        --pending || done();
      });

    ++pending;
    search
      .query('loki and jane')
      .type('or')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.have.length(2);
        ids.should.include('2');
        ids.should.include('4');
        --pending || done();
      });

    ++pending;
    search
      .query('loki and jane')
      .type('or')
      .end(function(err, ids){
        if (err) throw err;
        ids.should.have.length(2);
        ids.should.include('2');
        ids.should.include('4');
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
        ids.should.eql(['4']);
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
          ids.should.eql(['6']);
          search.query('cat').end(function(err, ids){
            if (err) throw err;
            ids.should.eql(['6']);
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
  })
})
