(function(root){
'use strict';
var enc=(typeof TextEncoder!=='undefined')?new TextEncoder():new (require('util').TextEncoder)();
function cps(s){return Array.from(s).map(function(c){return c.codePointAt(0);});}
function hex(n){var h=n.toString(16).toUpperCase();while(h.length<4)h='0'+h;return 'U+'+h;}
function bytesOf(s){return Array.from(enc.encode(s));}
function cmpArr(a,b){var n=Math.min(a.length,b.length);for(var i=0;i<n;i++){if(a[i]!==b[i])return a[i]<b[i]?-1:1;}return a.length===b.length?0:(a.length<b.length?-1:1);}
function units(s){var o=[];for(var i=0;i<s.length;i++)o.push(s.charCodeAt(i));return o;}
function foldLower(b){return b.map(function(x){return x>=65&&x<=90?x+32:x;});}
function foldUpper(b){return b.map(function(x){return x>=97&&x<=122?x-32:x;});}
// Each rule: key(s) -> array of numbers; rules compare keys lexicographically (shorter prefix first).
var RULES={
 utf16:{name:'JavaScript default sort()',sub:'UTF-16 code units, string by string',key:units,unit:'UTF-16 code unit'},
 codepoint:{name:'Code point order',sub:'Python sorted(), SQLite BINARY, sort in the C locale',key:cps,unit:'code point'},
 nocaselower:{name:'ASCII case-insensitive, folded to lower',sub:'SQLite NOCASE',key:function(s){return foldLower(bytesOf(s));},unit:'UTF-8 byte after folding A-Z to a-z'},
 nocaseupper:{name:'ASCII case-insensitive, folded to upper',sub:'sort -f in the C locale',key:function(s){return foldUpper(bytesOf(s));},unit:'UTF-8 byte after folding a-z to A-Z'}
};
function sortBy(items,rule){
  var R=RULES[rule],keyed=items.map(function(s,i){return {s:s,i:i,k:R.key(s)};});
  keyed.sort(function(x,y){var c=cmpArr(x.k,y.k);return c||x.i-y.i;});
  return keyed.map(function(x){return x.s;});
}
function keyOf(s,rule){return RULES[rule].key(s);}
function unitLabel(rule,v){
  if(rule==='utf16'||rule==='codepoint')return hex(v);
  return '0x'+(v<16?'0':'')+v.toString(16).toUpperCase();
}
function glyph(rule,v){
  if(rule==='utf16')return (v>=0xD800&&v<=0xDFFF)?'half of a surrogate pair':String.fromCharCode(v);
  if(rule==='codepoint')return String.fromCodePoint(v);
  return (v>=32&&v<127)?String.fromCharCode(v):'byte';
}
function why(a,b,rule){
  var ka=keyOf(a,rule),kb=keyOf(b,rule),n=Math.min(ka.length,kb.length);
  for(var i=0;i<n;i++){
    if(ka[i]!==kb[i]){
      return {rel:ka[i]<kb[i]?'lt':'gt',pos:i,a:ka[i],b:kb[i],text:'position '+(i+1)+': '+unitLabel(rule,ka[i])+(glyph(rule,ka[i]).length<=2?' ('+glyph(rule,ka[i])+')':'')+' vs '+unitLabel(rule,kb[i])+(glyph(rule,kb[i]).length<=2?' ('+glyph(rule,kb[i])+')':'')+(ka[i]<kb[i]?' - first is smaller':' - first is larger')};
    }
  }
  if(ka.length===kb.length)return {rel:'eq',text:'equal under this rule - original order kept'};
  return {rel:ka.length<kb.length?'lt':'gt',text:ka.length<kb.length?'first is a prefix of the second - shorter sorts first':'second is a prefix of the first - shorter sorts first'};
}
function numeric(items){
  var nums=items.map(function(s){var t=s.trim();return t!==''&&/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)?Number(t):NaN;});
  if(!nums.length||nums.some(function(x){return x!==x;}))return null;
  var idx=items.map(function(_,i){return i;});
  idx.sort(function(a,b){return nums[a]<nums[b]?-1:nums[a]>nums[b]?1:a-b;});
  return idx.map(function(i){return items[i];});
}
function jsNumberDefault(items){
  // what [..].sort() does to numbers: converts each to a string via String(Number)
  var nums=items.map(function(s){return Number(s.trim());});
  if(nums.some(function(x){return x!==x;}))return null;
  return nums.slice().sort().map(String);
}
var api={RULES:RULES,sortBy:sortBy,why:why,numeric:numeric,jsNumberDefault:jsNumberDefault,key:keyOf,cmpArr:cmpArr,hex:hex};
if(typeof module!=='undefined')module.exports=api;else root.SortWhy=api;
})(this);
