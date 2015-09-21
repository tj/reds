var 
  natural = require('natural');
var stopwords = natural.stopwords;
var stem = natural.PorterStemmer.stem;
var metaphone = natural.Metaphone.process;


var stemWords = function(words){
  var ret = [];
  if (!words) return ret;
  for (var i = 0, len = words.length; i < len; ++i) {
    ret.push(stem(words[i]));
  }
  return ret;
};
var splitWords = function(str){
  return String(str).match(/\w+/g);
};

var stripStopWords = function(words){
  var ret = [];
  if (!words) return ret;
  for (var i = 0, len = words.length; i < len; ++i) {
    if (~stopwords.indexOf(words[i])) continue;
    ret.push(words[i]);
  }
  return ret;
};

var metaphoneMap = function(words){
  var obj = {};
  if (!words) return obj;
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = metaphone(words[i]);
  }
  return obj;
};

var countWords = function(words){
  var obj = {};
  if (!words) return obj;
  for (var i = 0, len = words.length; i < len; ++i) {
    obj[words[i]] = (obj[words[i]] || 0) + 1;
  }
  return obj;
};

console.log(countWords(stemWords(stripStopWords(splitWords('This is my string of text. The text can be of long or short length.')))));
console.log(countWords(stemWords(stripStopWords(splitWords('This is my other text string.')))));
  
  