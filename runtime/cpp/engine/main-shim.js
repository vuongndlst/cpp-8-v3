/* JSCPP requires an explicit return where standard C++ gives main an implicit 0.
   Apply that rule ONLY to int main, retaining the student's original source. */
self.cppMainWithImplicitReturn=code=>{
 const masked=code.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/g,s=>s.replace(/[^\r\n]/g,' '));
 const match=/\bint\s+main\s*\([^)]*\)\s*\{/.exec(masked);if(!match)return code;
 const open=match.index+match[0].length-1;let depth=0;
 for(let i=open;i<masked.length;i++){if(masked[i]==='{')depth++;if(masked[i]==='}'&&--depth===0)return code.slice(0,i)+'\nreturn 0;\n'+code.slice(i)}
 return code;
};
