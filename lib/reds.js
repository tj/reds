
/*!
 * reds
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var natural = require('natural')
  , metaphone = natural.Metaphone.process;

/**
 * Library version.
 */

exports.version = '0.0.1';

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

exports.metaphone = function(str){
  var obj = {}
    , words = exports.words(str);
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = metaphone(words[i]);
  }
  return obj;
};
