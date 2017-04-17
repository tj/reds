/*!
 * reds
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var natural = require('natural');
var metaphone = natural.Metaphone.process;
var stem = natural.PorterStemmer.stem;
var stopwords = natural.stopwords;
var redis = require('redis');
function noop(){};

/**
 * Library version.
 */

exports.version = '1.0.0';

/**
 * Expose `Search`.
 */

exports.Search = Search;

/**
 * Expose `Query`.
 */

exports.Query = Query;

/**
 * Search types.
 */

var types = {
  intersect: 'zinterstore',
  union: 'zunionstore',
  and: 'zinterstore',
  or: 'zunionstore'
};

/**
 * Alternate way to set client 
 * provide your own behaviour.
 *
 * @param {RedisClient} inClient
 * @return {RedisClient}
 * @api public
 */

exports.setClient = function(inClient) {
  return exports.client = inClient;
}

/**
 * Create a redis client, override to
 * provide your own behaviour.
 *
 * @return {RedisClient}
 * @api public
 */

exports.createClient = function(){
  return exports.client
    || (exports.client = redis.createClient());
};

/**
 * Process indexing string into NLP components (words, counts, map, keys)
 * 
 * @param {String} str
 * @param {String} [key]
 */
exports.nlpProcess = function(str, key) {
  var words = exports.stem(exports.stripStopWords(exports.words(str)));
  var counts = exports.countWords(words);
  var map = exports.metaphoneMap(words);
  var keys = Object.keys(map);
  //the key argument is only needed for removing items from the index
  //by not executing the `metaphoneKeys` function, it speeds up indexing a bit
  var metaphoneKeys = !key ? null : exports.metaphoneKeys(key, words)
  

  return {
    words   : words,
    counts  : counts,
    map     : map,
    keys    : keys,
    metaphoneKeys
            : metaphoneKeys
  };
}

/**
 * Writes index to Redis
 * 
 * @param {Object} db Redis Client
 * @param {Number|String} id
 * @param {String} key
 * @param {Object} nlpObj Object with word map, counts, and keys
 * @param {Function} fn
 * 
 */
exports.writeIndex = function(db, id, key, nlpObj, fn) {
  var cmds = [];
  nlpObj.keys.forEach(function(word, i){
    cmds.push(['zadd', key + ':word:' + nlpObj.map[word], nlpObj.counts[word], id]);
    cmds.push(['zadd', key + ':object:' + id, nlpObj.counts[word], nlpObj.map[word]]);
  });
  db.multi(cmds).exec(fn || noop);
}

/**
 * Removes index from Redis
 * 
 * @param {Object} db Redis Client
 * @param {Number|String} id
 * @param {String} key
 * @param {Function} fn
 * 
 */
exports.removeIndex = function(db, id, key, fn) {
  db.zrevrangebyscore(key + ':object:' + id, '+inf', 0, function(err, constants){
    if (err) return fn(err);
    var multi = db.multi().del(key + ':object:' + id);
    constants.forEach(function(c){
      multi.zrem(key + ':word:' + c, id);
    });
    multi.exec(fn);
  });
}


/**
 * Return a new reds `Search` with the given `key`.
 * @param {Object} opts
 * @param {String} key
 * @return {Search}
 * @api public
 */

exports.createSearch = function(key,opts){
  if (!key) throw new Error('createSearch() requires a redis key for namespacing');
  
  opts = !opts ? {} : opts;
  opts.nlpProcess = !opts.nlpProcess ? exports.nlpProcess : opts.nlpProcess;
  opts.writeIndex = !opts.writeIndex ? exports.writeIndex : opts.writeIndex;
  opts.removeIndex = !opts.removeIndex ? exports.removeIndex : opts.removeIndex;
  
  return new Search(key, opts.nlpProcess, opts.writeIndex, opts.removeIndex);
};

/**
 * Return the words in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.words = function(str){
  return String(str).match(/\w+/g);
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
  if (!words) return ret;
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
  if (!words) return ret;
  for (var i = 0, len = words.length; i < len; ++i) {
    if (~stopwords.indexOf(words[i])) continue;
    ret.push(words[i]);
  }
  return ret;
};

/**
 * Returns an object mapping each word in a Array
 * to the number of times it occurs in the Array.
 *
 * @param {Array} words
 * @return {Object}
 * @api private
 */

exports.countWords = function(words){
  var obj = {};
  if (!words) return obj;
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = (obj[words[i]] || 0) + 1;
  }
  return obj;
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
  if (!words) return obj;
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
  var arr = [];
  var constant;

  if (!words) return arr;
  
  for (var i = 0, len = words.length; i < len; ++i) {
    constant = metaphone(words[i]);
    if (!~arr.indexOf(constant)) arr.push(constant);
  }
  
  return arr;
};

/**
 * Return a map of metaphone constant redis keys for `words`
 * and the given `key`.
 *
 * @param {String} key
 * @param {Array} words
 * @return {Array}
 * @api private
 */

exports.metaphoneKeys = function(key, words){
  return exports.metaphoneArray(words).map(function(c){
    return key + ':word:' + c;
  });
};

/**
 * Initialize a new `Query` with the given `str`
 * and `search` instance.
 *
 * @param {String} str
 * @param {Search} search
 * @api public
 */

function Query(str, search) {
  this.str = str;
  this.type('and');
  this.search = search;
}

/**
 * Set `type` to "union" or "intersect", aliased as
 * "or" and "and".
 *
 * @param {String} type
 * @return {Query} for chaining
 * @api public
 */

Query.prototype.type = function(type){
  this._type = types[type];
  return this;
};

/**
 * Limit search to the specified range of elements.
 *
 * @param {String} start
 * @param {String} stop
 * @return {Query} for chaining
 * @api public
 */
Query.prototype.between = function(start, stop){
  this._start = start;
  this._stop = stop;
  return this;
};

/**
 * Perform the query and callback `fn(err, ids)`.
 *
 * @param {Function} fn
 * @return {Query} for chaining
 * @api public
 */

Query.prototype.end = function(fn){
  var key = this.search.key;
  var db = this.search.client;
  var query = this.str;
  var nlpObj = this.search.nlpProcess(query, key);
  var keys = nlpObj.metaphoneKeys;
  var type = this._type;
  var start = this._start || 0;
  var stop = this._stop || -1;

  if (!keys.length) return fn(null, []);

  var tkey = key + 'tmpkey';
  db.multi([
    [type, tkey, keys.length].concat(keys),
    ['zrevrange', tkey, start, stop],
    ['zremrangebyrank', tkey, start, stop],
  ]).exec(function(err, ids) {
    if (err) {
      return fn(err)
    }
    ids = ids[1];
    fn(err, ids);
  });

  return this;
};

/**
 * Initialize a new `Search` with the given `key`.
 *
 * @param {String} key
 * @api public
 */

function Search(key, nlpProcess, writeIndex, removeIndex) {
  this.key = key;
  this.client = exports.createClient();

  this.nlpProcess = nlpProcess;
  this.writeIndex = writeIndex;
  this.removeIndex = removeIndex;
}

/**
 * Index the given `str` mapped to `id`.
 *
 * @param {String} str
 * @param {Number|String} id
 * @param {Function} fn
 * @api public
 */

Search.prototype.index = function(str, id, fn){
  var key = this.key;
  var db = this.client;
  var nlpObj = this.nlpProcess(str);

  this.writeIndex(db, id, key, nlpObj, fn);

  return this;
};

/**
 * Remove occurrences of `id` from the index.
 *
 * @param {Number|String} id
 * @api public
 */

Search.prototype.remove = function(id, fn){
  fn = fn || noop;
  var key = this.key;
  var db = this.client;
  
  this.removeIndex(db, id, key, fn);
  
  return this;
};

/**
 * Perform a search on the given `query` returning
 * a `Query` instance.
 *
 * @param {String} query
 * @param {Query}
 * @api public
 */

Search.prototype.query = function(query){
  return new Query(query, this);
};
