/*!
 * redredisearch
 * 
 * Forked from tj/reds
 * Original work Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * Modified work Copyright(c) 2017 Kyle Davis
 * MIT Licensed
 */

/**
 * Module dependencies.
 */


var redis = require('redis');
function noop(){};

/**
 * Library version.
 */

exports.version = '0.0.1';

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
  intersect: 'and',
  union: 'or',
  and: 'and',
  or: 'or'
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
 * Confirm the existence of the RediSearch Redis module
 *
 * @api public
 */

exports.confirmModule = function(cb) {
  exports.client.send_command('ft.create',[], function(err) {
    let strMsg = String(err);
    if (strMsg.indexOf('ERR wrong number of arguments') > 0) {
      cb(null);
    } else {
      cb(err);
    }
  });
}

/**
 * Return a new reds `Search` with the given `key`.
 * @param {String} key
 * @param {Object} opts
 * @return {Search}
 * @api public
 */

exports.createSearch = function(key,opts,cb){
  const 
    searchObj   = function(err,info) {
      if (err) { cb(err); } else {
        cb(err,new Search(key,info,opts));
      }
    };

  opts = !opts ? {} : opts;
  opts.payloadField = opts.payloadField ? opts.payloadField : 'payload';

  if (!key) throw new Error('createSearch() requires a redis key for namespacing');
  
  exports.client.send_command('FT.INFO',[key],function(err,info) {
    if (err) { 
      //if the index is not found, we need to make it.
      if (String(err).indexOf('Unknown Index name') > 0 ){
        let args = [
          key,
          'SCHEMA', opts.payloadField, 'text'
        ];
        exports.client.send_command(
          'FT.CREATE',
          args,
          function(err) {
            if (err) { cb(err); } else {
              exports.client.send_command('FT.INFO',[key],searchObj);
            }
          }
        );
      }

    } else { searchObj(err,info); }
  });
};

/**
 * Return the words in `str`. This is for compatability reasons (convert OR queries to pipes)
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.words = function(str){
  return String(str).match(/\w+/g);
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
  if (type === 'direct') {
    this._directQuery = true;
  } else {
    this._direct = false;
    this._type = types[type];
  }
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
  var 
    key     = this.search.key,
    db      = this.search.client,
    query   = this.str,
    direct  = this._directQuery,
    args    = [],
    joiner  = ' ',
    rediSearchQuery;

    if (direct) {
    rediSearchQuery = query;
  } else {
    rediSearchQuery = exports.words(query);
    if (this._type === 'or') {
      joiner = '|'
    }
    rediSearchQuery = rediSearchQuery.join(joiner);
  } 
  args = [
    key,
    rediSearchQuery,
    'NOCONTENT'
  ];
  if (this._start) {
    args.push('LIMIT',this._start,this._end - this._start);
  }

  db.send_command(
    'FT.SEARCH',
    args,
    function(err,resp) {
      if (err) { fn(err); } else {
        fn(err,resp.slice(1));
      }
    }
  );

  return this;
};

/**
 * Initialize a new `Suggestion` with the given `key`.
 *  
 * @param {String} key
 * @param {Object} opts
 * @api public
 */
var Suggestion = function(key,opts) {
  this.key = key;
  this.client = exports.createClient();
  this.opts = opts || {};
  if (this.opts.fuzzy) {
    this.fuzzy = opts.fuzzy;
  }
  if (this.opts.max) {
    this.max = opts.max;
  }
  if (this.opts.incr) {
    this.incr = opts.incr;
  }
}

/**
 * Create a new Suggestion object
 * 
 * @param {String} key
 * @param {Object} opts
 * @api public 
 */
exports.suggestionList = function(key,opts) {
  return new Suggestion(key,opts);
}

/**
 * Set `fuzzy` on suggestion get. Can also be set via opts in the constructor
 *
 * @param {Boolean} isFuzzy
 * @return {Suggestion} for chaining
 * @api public
 */

Suggestion.prototype.fuzzy = function(isFuzzy){
  this.fuzzy = isFuzzy;
  return this;
};

/**
 * Set the max number of returned suggestions. Can also be set via opts in the constructor
 *
 * @param {Number} maxResults
 * @return {Suggestion} for chaining
 * @api public
 */

Suggestion.prototype.maxResults = function(maxResults){
  this.maxResults = maxResults;
  return this;
};

Suggestion.prototype.add = function(str,score,fn) {
  var key = this.key;
  var db = this.client;
  var args = [
    key,
    str,
    score,
  ];
  if (this.incr) {
    args.push('INCR');
  }
  db.send_command(
    'FT.SUGADD',
    args,
    fn || noop
  );
  return this;
}

Suggestion.prototype.get = function(prefix,fn) {
  var key = this.key;
  var db = this.client;
  var args = [
    key,
    prefix
  ];
  if (this.fuzzy) {
    args.push('FUZZY');
  }
  if (this.maxResults) {
    args.push('MAX',this.maxResults);
  }

  db.send_command(
    'FT.SUGGET',
    args,
    fn
  );

  return this;
}

Suggestion.prototype.del = function(str,fn) {
  var key = this.key;
  var db = this.client;

  db.send_command(
    'FT.SUGDEL',
    [ 
      key,
      str
    ],
    fn
  );

  return this;
}

/**
 * Initialize a new `Search` with the given `key`.
 *
 * @param {String} key
 * @api public
 */

function Search(key,info,opts) {
  this.key = key;
  this.client = exports.createClient();
  this.opts = opts;
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
  var opts = this.opts;

  db.send_command(
    'FT.ADD',
    [
      key,
      id,
      1,            //default - this should be to be set in future versions
      'NOSAVE',     //emulating Reds original behaviour
      'REPLACE',    //emulating Reds original behaviour
      'FIELDS', 
      opts.payloadField, 
      str
    ],
    fn || noop
  );

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
  
  //this.removeIndex(db, id, key, fn);
  db.send_command(
    'FT.DEL',
    [
      key,
      id
    ],
    fn
  )
  
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
