#!/usr/bin/env python3
# Reads JSON {"lists":[[str,...],...]} on stdin. For each list returns what real tools give:
# python sorted (code points), SQLite BINARY, SQLite NOCASE, GNU sort -s -f (C locale), GNU sort (C locale).
import sys,json,sqlite3,subprocess,os
d=json.load(sys.stdin);out=[]
con=sqlite3.connect(':memory:');con.execute('create table t(i integer, x text)')
env=dict(os.environ,LC_ALL='C')
def gnusort(lst,args):
    if any('\n' in s for s in lst): return None
    r=subprocess.run(['sort']+args,input=('\n'.join(lst)+'\n').encode('utf-8','surrogatepass'),capture_output=True,env=env)
    return r.stdout.decode('utf-8','surrogatepass').split('\n')[:-1]
for lst in d['lists']:
    con.execute('delete from t');con.executemany('insert into t values(?,?)',list(enumerate(lst)))
    o={}
    o['py']=sorted(lst)
    o['bin']=[r[0] for r in con.execute('select x from t order by x collate binary, i')]
    o['nocase']=[r[0] for r in con.execute('select x from t order by x collate nocase')]
    o['sort']=gnusort(lst,['-s']) if d.get('gnu') else None
    o['sortf']=gnusort(lst,['-s','-f']) if d.get('gnu') else None
    out.append(o)
json.dump(out,sys.stdout)
