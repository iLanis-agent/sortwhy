// node test-engine.js SEED N [gnu]   compares the engine with Python, SQLite and GNU sort
var S=require('./engine.js'),cp=require('child_process');
var seed=+process.argv[2]||1,N=+process.argv[3]||2000,gnu=process.argv[4]==='gnu';
function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function pick(a){return a[Math.floor(rnd()*a.length)];}
var pieces=['a','b','z','A','B','Z','0','1','9','_','-',' ','.','~','[','`','e','E','\u00e9','\u00c9','\u00ff','\u0153','\uff5a','\uff21','\u4e2d','\ufb01','\u20ac','\ud83d\ude00','\ud835\udc9c','\ud801\udc00','\u{10ffff}','\ud7ff','\ue000','\uffee'];
function str(){var n=Math.floor(rnd()*5),s='';for(var i=0;i<n;i++)s+=pick(pieces);return s;}
var lists=[];for(var i=0;i<N;i++){var n=2+Math.floor(rnd()*10),l=[];for(var j=0;j<n;j++)l.push(rnd()<.2&&l.length?l[0]+pick(pieces):str());lists.push(l);}
var res=JSON.parse(cp.execSync('python3 oracle.py',{input:JSON.stringify({lists:lists,gnu:gnu}),maxBuffer:1<<29}));
var st={};function rec(k,ok){st[k]=st[k]||{n:0,bad:0};st[k].n++;if(!ok)st[k].bad++;}
var shown=0;
function same(a,b){return a&&b&&a.length===b.length&&a.every(function(x,i){return x===b[i];});}
function keysSame(a,b,rule){return a.length===b.length&&a.every(function(x,i){return S.cmpArr(S.key(x,rule),S.key(b[i],rule))===0;});}
lists.forEach(function(l,i){
  var o=res[i];
  var cpE=S.sortBy(l,'codepoint');
  var ok=same(cpE,o.py);rec('codepoint vs Python sorted',ok);if(!ok&&shown++<5)console.log('py',JSON.stringify(l),JSON.stringify(cpE),JSON.stringify(o.py));
  rec('codepoint vs SQLite BINARY',same(cpE,o.bin));
  rec('utf16 vs node Array.sort',same(S.sortBy(l,'utf16'),l.slice().sort()));
  rec('nocase-lower vs SQLite NOCASE',keysSame(S.sortBy(l,'nocaselower'),o.nocase,'nocaselower'));
  if(gnu&&o.sort){rec('codepoint vs sort (C locale)',same(cpE,o.sort));rec('nocase-upper vs sort -s -f (C locale)',same(S.sortBy(l,'nocaseupper'),o.sortf));}
  // numeric
});
// numeric lists vs Python float sort and JS default sort quirk
var nl=[];for(var k=0;k<Math.max(200,N/4);k++){var m=2+Math.floor(rnd()*8),a=[];for(var q=0;q<m;q++){var t=rnd();a.push(t<.4?String(Math.floor(rnd()*200)-50):t<.7?(rnd()*100-20).toFixed(Math.floor(rnd()*3)):String(Math.floor(rnd()*100000)));}nl.push(a);}
var pyn=JSON.parse(cp.execSync("python3 -c \"import sys,json;d=json.load(sys.stdin);print(json.dumps([sorted(l,key=float) for l in d]))\"",{input:JSON.stringify(nl)}));
var jsd=cp.execSync("node -e \"var d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(d.map(function(l){return l.map(Number).sort().map(String);})))\"",{input:JSON.stringify(nl)});
var jsdd=JSON.parse(jsd);
nl.forEach(function(l,i){var e=S.numeric(l);rec('numeric vs Python sorted(key=float)',e&&e.map(Number).join()===pyn[i].map(Number).join());var j=S.jsNumberDefault(l);rec('JS number default sort quirk vs node',j&&j.join()===jsdd[i].join());});
console.log(JSON.stringify({seed:+process.argv[2],lists:N,gnu:gnu,stats:st}));
