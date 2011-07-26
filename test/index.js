
/**
 * Module dependencies.
 */

var reds = require('../')
  , should = require('should');

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

reds
  .add('Tobi wants 4 dollars', 0)
  .add('Tobi wants $4', 1)
  .add('Loki is a ferret', 2)
  .add('Tobi is also a ferret', 3)
  .add('Jane is a bitchy ferret', 4)
  .add('Tobi is employed by LearnBoost', 5);

reds
  .search('Tobi', function(err, ids){
    if (err) throw err;
    ids.should.eql([0, 1, 3, 5]);
    process.exit();
  });