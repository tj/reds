
/*!
 * reds
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var natural = require('natural')
  , metaphone = natural.Metaphone.process
  , stem = natural.PorterStemmer.stem
  , stopwords = require('./stopwords')
  , redis = require('redis')
  , noop = function(){};

/**
 * Library version.
 */

exports.version = '0.0.1';

/**
 * Search types.
 */

var types = {
    intersect: 'sinter'
  , union: 'sunion'
  , and: 'sinter'
  , or: 'sunion'
};

/**
 * Create a redis client.
 *
 * @return {RedisClient}
 * @api public
 */

exports.createClient = redis.createClient;

/**
 * Return the words in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.words = function(str){
  return String(str).trim().split(/\W+/);
};

/**
 * Stem the given `words`.
 *
 * @param {Array} words
 * @return {Array}
 * @api private
 */

exports.stem = function(words){
  var ret = [];
  for (var i = 0, len = words.length; i < len; ++i) {
    ret.push(stem(words[i]));
  }
  return ret;
};

/**
 * Strip stop words in `words`.
 *
 * @param {Array} words
 * @return {Array}
 * @api private
 */

exports.stripStopWords = function(words){
  var ret = [];
  for (var i = 0, len = words.length; i < len; ++i) {
    if (~stopwords.indexOf(words[i])) continue;
    ret.push(words[i]);
  }
  return ret;
};

/**
 * Return the given `words` mapped to the metaphone constant.
 *
 * Examples:
 *
 *    metaphone(['tobi', 'wants', '4', 'dollars'])
 *    // => { '4': '4', tobi: 'TB', wants: 'WNTS', dollars: 'TLRS' }
 *
 * @param {Array} words
 * @return {Object}
 * @api private
 */

exports.metaphoneMap = function(words){
  var obj = {};
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = metaphone(words[i]);
  }
  return obj;
};

/**
 * Return an array of metaphone constants in `words`.
 *
 * Examples:
 *
 *    metaphone(['tobi', 'wants', '4', 'dollars'])
 *    // => ['4', 'TB', 'WNTS', 'TLRS']
 *
 * @param {Array} words
 * @return {Array}
 * @api private
 */

exports.metaphoneArray = function(words){
  var arr = []
    , constant;
  for (var i = 0, len = words.length; i < len; ++i) {
    constant = metaphone(words[i]);
    if (!~arr.indexOf(constant)) arr.push(constant);
  }
  return arr;
};

/**
 * Return a map of metaphone constant redis keys for `words`.
 *
 * @param {Array} words
 * @return {Array}
 * @api private
 */

exports.metaphoneKeys = function(words){
  return exports.metaphoneArray(words).map(function(c){
    return 'reds:word:' + c;
  });
};

/**
 * Add `str` mapped to `id` as a searchable
 * body of text.
 *
 * @param {String} str
 * @param {Number|String} id
 * @param {Function} fn
 * @api public
 */

exports.add = function(str, id, fn){
  var db = exports.createClient()
    , words = exports.stem(exports.stripStopWords(exports.words(str)))
    , map = exports.metaphoneMap(words)
    , keys = Object.keys(map)
    , len = keys.length;

  var multi = db.multi();
  keys.forEach(function(word, i){
    multi.sadd('reds:word:' + map[word], id);
    multi.sadd('reds:object:' + id, map[word]);
  });
  multi.exec(fn || noop);

  return this;
};

/**
 * Remove occurrences of `id` from the index.
 *
 * @param {Number|String} id
 * @api public
 */

exports.remove = function(id, fn){
  fn = fn || noop;
  var db = exports.createClient();
  db.smembers('reds:object:' + id, function(err, constants){
    if (err) return fn(err);
    var multi = db.multi().del('reds:object:' + id);
    constants.forEach(function(c){
      multi.srem('reds:word:' + c, id);
    });
    multi.exec(fn);
  });
  return this;
};

/**
 * Perform a search on the given `query` string
 * and invoke the callback `fn(err, ids)`.
 *
 * The search `type` may be "or", "and", "intersect"
 * or "union", defaulting to "or".
 *
 * @param {String} query
 * @param {Function} fn
 * @param {String} type
 * @api public
 */

exports.search = function(query, fn, type){
  var words = exports.stem(exports.stripStopWords(exports.words(query)))
    , keys = exports.metaphoneKeys(words)
    , db = exports.createClient()
    , type = type || 'or';

  if (!keys.length) return fn(null, []);
  db[types[type]](keys, fn);
};
