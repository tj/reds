
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
  , redis = require('redis');

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
 * @api public
 */

exports.words = function(str){
  return String(str).split(/\W+/);
};

exports.stripStopWords = function(words){
  for (var i = 0, len = obj.length; i < len; ++i) {
    
  }
};

/**
 * Return a map of words in `str` mapped to
 * the metaphone constant.
 *
 * Examples:
 *
 *    metaphone('tobi wants 4 dollars')
 *    // => { '4': '4', tobi: 'TB', wants: 'WNTS', dollars: 'TLRS' }
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.metaphoneMap = function(str){
  var obj = {}
    , words = exports.words(str);
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = metaphone(words[i]);
  }
  return obj;
};

/**
 * Return an array of metaphone constants in `str`.
 *
 * Examples:
 *
 *    metaphone('tobi wants 4 dollars')
 *    // => ['4', 'TB', 'WNTS', 'TLRS']
 *
 * @param {String} str
 * @return {Array}
 * @api public
 */

exports.metaphoneArray = function(str){
  var arr = []
    , words = exports.words(str)
    , constant;
  for (var i = 0, len = words.length; i < len; ++i) {
    constant = metaphone(words[i]);
    if (!~arr.indexOf(constant)) arr.push(constant);
  }
  return arr;
};

/**
 * Return a map of metaphone constant redis keys for `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api public
 */

exports.metaphoneKeys = function(str){
  return exports.metaphoneArray(str).map(function(c){
    return 'word:' + c;
  });
};

/**
 * Add `str` mapped to `id` as a searchable
 * body of text.
 *
 * @param {String} str
 * @param {Number|String} id
 * @api public
 */

exports.add = function(str, id){
  var db = exports.createClient()
    , map = exports.metaphoneMap(str);
  for (var word in map) {
    db.sadd('word:' + map[word], id);
  }
};

/**
 * Remove `str` mapped to `id` as a searchable
 * body of text.
 *
 * @param {String} str
 * @param {Number|String} id
 * @api public
 */

exports.remove = function(str, id){
  var db = exports.createClient()
    , map = exports.metaphoneMap(str);
  for (var word in map) {
    db.srem('word:' + map[word], id);
  }
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
  var keys = exports.metaphoneKeys(query)
    , db = exports.createClient()
    , type = type || 'or';
  db[types[type]](keys, fn);
};