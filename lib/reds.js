
/*!
 * reds
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.0.1';

/**
 * The word `str` passed is filtered through the
 * phonetic algo developed by Lawrence Philips.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

module.exports = function metaphone(str) {
  // 1. drop duplicate adjacent letters except for C
  str = str.replace(/([abdefghijklmnopqrstuvwxyz])\1/gi, '$1');
  // 2. word begins with 'KN', 'GN', 'PN', 'AE', 'WR', drop the first letter
  str = str.replace(/(kn|gn|pn|ae|wr)/gi, function(_, a){ return a[1] });
  // 3. drop 'B' if after 'M' and if it is at the end of the word.
  str = str.replace(/mb\b/gi, 'm');
  // 4. 'C' transforms to 'X' if followed by 'IA' or 'H' (unless in latter 
  //    case, it is part of '-SCH-', in which case it transforms to 'K').
  //    'C' transforms to 'S' if followed by 'I', 'E', or 'Y'. Otherwise,
  //    'C' transforms to 'K'.
  str = str.replace(/(ia|h)?c([iey])?/gi, function(_, a, b){
    if (a) return a + 'x' + (b || '');
    if (b) return (a || '') + 's' + b;
    return (a || '') + 'k' + (b || '');
  });
  // 5. 'D' transforms to 'J' if followed by 'GE', 'GY', or 'GI'.
  //    Otherwise, 'D' transforms to 'T'.
  str = str.replace(/d(g[eyi])?/gi, function(_, a){
    if (a) return 'j' + a;
    return 't';
  });
  // 6. drop 'G' if followed by 'H' and 'H' is not at the end
  //    or before a vowel. Drop 'G' if followed by 'N' or 'NED'
  //    and is at the end.
  // str = str.replace(/gh/gi);
  // 7. 'G' transforms to 'J' if before 'I', 'E', or 'Y', and it is
  //    not in 'GG'. Otherwise, 'G' transforms to 'K'.
  str = str.replace(/g([iey])/gi, 'j$1').replace(/g/gi, 'k');
  // 8. drop 'H' if after vowel and not before a vowel.
  str = str.replace(/([aeiou])h([^aeiou]|$)/gi, '$1$2');
  // 9. 'CK' transforms to 'K'.
  str = str.replace(/ck/gi, 'k');
  // 10. 'PH' transforms to 'F'.
  str = str.replace(/ph/gi, 'f');
  // 11. 'Q' transforms to 'K'.
  str = str.replace(/q/gi, 'k');
  // 12. 'S' transforms to 'X' if followed by 'H', 'IO', or 'IA'.
  str = str.replace(/s(h|io|ia)/gi, 'x$1');
  // 13. 'T' transforms to 'X' if followed by 'IA' or 'IO'. 'TH' transforms
  //     to '0'. Drop 'T' if followed by 'CH'.
  str = str.replace(/t(ia|io)/gi, 'x').replace(/th/gi, '0');
  // 14. 'V' transforms to 'F'.
  str = str.replace(/v/gi, 'f');
  // 15. 'WH' transforms to 'W' if at the beginning. Drop 'W' if not followed by a vowel.
  str = str.replace(/^wh/gi, 'w').replace(/w([^aeiou]|$)/gi, '$1');
  // 16. 'X' transforms to 'S' if at the beginning. Otherwise, 'X' transforms to 'KS'.
  str = str.replace(/^x/gi, 's').replace(/x/gi, 'ks');
  // 17. Drop 'Y' if not followed by a vowel.
  str = str.replace(/y([^aeiou]|$)/gi, '$1');
  // 18. 'Z' transforms to 'S'.
  str = str.replace(/z/gi, 's');
  // 19. Drop all vowels unless it is the beginning
  str = str.replace(/^([aeiou])|([aeiou])/gi, function(_, a, b){
    if (a) return a;
    return '';
  });
  return str.toUpperCase();
};
