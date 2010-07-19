/**
Sunday Jul 18, end of weekend. basic interpreter working with functions, closures, and variables. 
Numbers only.

E.g. (let 
	(double (lambda (num) (+ num num)))
	(double (double 20))) 
	
	returns 80.
**/

// Adding some string functions
// from http://stackoverflow.com/questions/273789
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

String.prototype.regexLastIndexOf = function(regex, startpos) {
    regex = regex.global ? regex: new RegExp(regex.source, "g" + (regex.ignoreCase ? "i": "") + (regex.multiLine ? "m": ""));
    if (typeof(startpos) == "undefined") {
        startpos = this.length;
    } else if (startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = this.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var result, nextStop = 0;
    while ((result = regex.exec(stringToWorkWith)) !== null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};

/* Adding empty? */
String.prototype.isEmpty = function() {
    return this.length === 0;
};

var wisp = {};

/* parses ala Scheme read, types returned:
	- numbers
	- symbols (anything that isn't numeric)
	- lists
*/

wisp.EOF = {
    type: "EOF"
};
wisp.EOL = {
    type: "EOL"
};

wisp.read = function(wispScript, advance) {
    if (wispScript.length === 0 || wispScript.length <= advance['index']) return wisp.EOF;
    var upToHere = wispScript.substring(advance['index']);
    var nextChar = upToHere.trim()[0];
    if (nextChar === ")") {
        advance['index'] += upToHere.indexOf(")") + 1;
        return wisp.EOL;
    }
    else if (nextChar !== "(") {
        // find index of whichever comes first; whitespace or a close parens.
        // return token up to there.
        var closeParen, whiteSpace, endOfToken;
        closeParen = upToHere.indexOf(")");
        if (closeParen === -1) closeParen = Infinity;
        whiteSpace = upToHere.regexIndexOf(/\S\s/) + 1;
        if (whiteSpace < 1) whiteSpace = (wispScript.length - advance['index']);
        endOfToken = (closeParen < whiteSpace) ? closeParen: whiteSpace;
        var token = wispScript.substring(advance['index'], advance['index'] + endOfToken).trim();
        advance['index'] += endOfToken;
        return isNaN(parseFloat(token)) ? token: parseFloat(token);
    }
    else {
        advance['index'] += upToHere.indexOf("(") + 1;
        var val, sexp = [];
        while (true) {
            val = wisp.read(wispScript, advance);
            if (val === wisp.EOF) throw "Error: end of file reached without reaching list end";
            if (val === wisp.EOL) break;
            sexp.push(val);
        }
        return sexp;
    }
};

wisp.isList = function(val) {
    return val instanceof Array;
};
wisp.isNumber = function(val) {
    return ((typeof val) === "number");
};
wisp.isSymbol = function(val) {
    return ((typeof val) === "string");
};

/** End reader stuff **/

/*** Parser
WE: Wisp Expression
<WE> ::= <num>
         | {+ <WE> <WE>}
         | {let {<id> <WE>} <WE>}
         | <id>
         | {lambda {<id>} <WE>}
         | {<WE> <WE>}

**/

/* internal sexp -> WispAbstractSyntax */
wisp.parse = function(sexp) {
    if (wisp.isNumber(sexp)) {
        return ["num", sexp];
    }
    else if (wisp.isSymbol(sexp)) {
        return ["id", sexp];
    }
    else if (wisp.isList(sexp)) {
        switch (sexp[0]) {
        case "+":
            return ["add", wisp.parse(sexp[1]), wisp.parse(sexp[2])];
        case "-":
            return ["sub", wisp.parse(sexp[1]), wisp.parse(sexp[2])];
        case "let":
            // turn substitution into function application
            return ["app", ["lambda", sexp[1][0], wisp.parse(sexp[2])], wisp.parse(sexp[1][1])];
        case "lambda":
            return ["lambda", sexp[1][0], wisp.parse(sexp[2])];
        default:
            return ["app", wisp.parse(sexp[0]), wisp.parse(sexp[1])];
        }
    }
    else throw "Parse Error"
};

wisp.envLookup = function(symbol, env) {
    var val = env[symbol];
    if (val === undefined) {
        throw "given symbol name not in environment";
    }
    else {
        return val;
    }
};

/* parsed abstract wisp syntax => number */
wisp.interp = function(expr, env) {
    var closure, appEnv;
    switch (expr[0]) {
    case "num":
        return expr[1];
    case "add":
        return (wisp.interp(expr[1], env) + wisp.interp(expr[2], env));
    case "sub":
        return (wisp.interp(expr[1], env) - wisp.interp(expr[2], env));
    case "id":
        return wisp.envLookup(expr[1], env);
    case "lambda":
        // create and return a closure
        closure = {};
        closure["param"] = expr[1];
        closure['body'] = expr[2];
        closure['env'] = env;
		console.log("found lambda, env:"); console.log(env);
        return closure;
    case "app":
        closure = wisp.interp(expr[1], env);
        appEnv = closure['env'];
        appEnv[closure['param']] = wisp.interp(expr[2], env);
        return wisp.interp(closure['body'], appEnv);
    default:
        throw "Interpreter error, unknown abstract syntax type";
    }
};

//
// Get all <link> tags with the 'rel' attribute set to "script/wisp"
// Modified from less.js (http://github.com/cloudhead/less.js)
//
var links = document.getElementsByTagName('link');
var typePattern = /^text\/(x-)?wisp$/;

wisp.scripts = [];

for (var i = 0; i < links.length; i++) {
    if (links[i].rel === 'script/wisp' || (links[i].rel.match(/script/) && links[i].type.match(typePattern))) {
        wisp.scripts.push(links[i]);
    }
}

var sexps = [];
var parsed = [];
// for now just get first one, fetch it and interpret it
$.get(wisp.scripts[0].href,
function(wispScript) {
    sexps.push(wisp.read(wispScript, {'index': 0}));
    parsed.push(wisp.parse(sexps[0]));
    $("body").html("Wisp script returned: " + wisp.interp(parsed[0], {}));
});
