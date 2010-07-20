/**
Late night, Monday July 19th (actually 1am on tuesday July 20th)

significant progress on adding more common lisp language features.
 - Changed internal representation to be prop lisp linked-list structure,
allowing for much more elegant solutions and hopefully future macros systems
- Added primitive list processing functions to language like list, first, rest, cons
- Added booleans, single-worded strings (weird, yes, reader needs to be smarter),
and the 'cond' control expression
- Allowed for 'infinite'-length procedures: eg "+", "-", "*", and "/" all take
an arbitray number of parameters, same with lambda
- Added 'def' to define variables in environment, allowing for longer files with
multiple s-expressions and definitions. 

E.g. this all works and correctly interprets:

(def make-adder
	(lambda (num1 num2)
		(lambda (other)
			(+ num1 num2 other))))
		
((make-adder 120 30) 100)

==> returns 250

(def printType
	(lambda (item)
		(cond
			((atom? item) "atom!")
			((empty? item) "empty!")
			((list? item) "nonEmptyList!"))))

(printType "sonia")

==> returns "atom!"

Comments would be nice to have.

Morning of Tuesday:

Just realized that recursion for 'def' already works implicitly!
I think we are now turing-complete :)

(def length
	(lambda (ls)
		(cond
			((empty? ls) 0)
			(else (+ 1 (length (rest ls))))
			)))

(length (list "hi" "there" "babe"))

==> returns 3

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

wisp.empty = []; // The empty list, end of all lists
wisp.isEmpty = function(list) {
    return (list instanceof Array) && (list.length === 0);
};
wisp.isNumber = function(val) {
    return ((typeof val) === "number");
};
wisp.isSymbol = function(val) {
    return ((typeof val) === "string");
};
wisp.isBoolean = function(val) {
    return ((typeof val) === "boolean");
};
wisp.isAtom = function(val) {
    return wisp.isNumber(val) || wisp.isBoolean(val) || wisp.isSymbol(val);
};
wisp.isNonEmptyCons = function(val) {
    return (val instanceof Array) && (val.length === 2);
};
wisp.isCons = function(val) {
    return wisp.isEmpty(val) || wisp.isNonEmptyCons(val);
};
wisp.cons = function(first, rest) {
    if (!wisp.isCons(rest)) throw "Wisp error: must cons onto another list";
    return [first, rest];
};
wisp.first = function(list) {
    if (!wisp.isNonEmptyCons(list)) throw "Wisp error: first is only defined for the non-empty lists";
    return list[0];
};
wisp.second = function(list) {
    return wisp.first(wisp.rest(list));
};
wisp.third = function(list) {
    return wisp.first(wisp.rest(wisp.rest(list)));
};
wisp.firsts = function(list){
	if (wisp.isEmpty(list)) return list;
	return wisp.cons(wisp.first(wisp.first(list)), wisp.firsts(wisp.rest(list)));
};
wisp.seconds = function(list){
	if (wisp.isEmpty(list)) return list;
	return wisp.cons(wisp.second(wisp.first(list)), wisp.seconds(wisp.rest(list)));
}; 
wisp.rest = function(list) {
    if (!wisp.isNonEmptyCons(list)) throw "Wisp error: rest is only defined for the non-empty lists";
    return list[1];
};

wisp.readIntoArray = function(wispScript, advance) {
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
            val = wisp.readIntoArray(wispScript, advance);
            if (val === wisp.EOF) throw "Error: end of file reached without reaching list end";
            if (val === wisp.EOL) break;
            sexp.push(val);
        }
        return sexp;
    }
};

wisp.read = function(wispScript, advance) {
	if (advance === undefined) advance = {'index': 0 };
    var arrd = wisp.readIntoArray(wispScript, advance).toWispSexp();
	return arrd;
};

// converts array (such as that produced by readIntoArray) into wisp sexp
// inspired by similar function in http://onestepback.org/index.cgi/Tech/Ruby/LispInRuby.red
Array.prototype.toWispSexp = function() {
    var i, item, reversed, result = wisp.empty;
    reversed = this.reverse();
    for (i = 0; i < reversed.length; i++) {
        item = reversed[i];
        if (item instanceof Array) item = item.toWispSexp();
        result = wisp.cons(item, result);
    }
    return result;
};

Array.prototype._toWispString = function(start) {
    if (!wisp.isCons(this)) throw "toWispString only applies to Wisp lists";
    if (wisp.isEmpty(this)) return "";
    var restStr, str = "",
    first = wisp.first(this);
    if (start) str = "(";
    str += wisp.isCons(first) ? first._toWispString(true) : first;
    restStr = wisp.rest(this)._toWispString(false);
    str += (restStr === "") ? "": " ";
    str += restStr;
    if (start) str = str + ")";
    return str;
};

Array.prototype.toWispString = function() {
    return this._toWispString(true);
};

/** End reader stuff **/

/* Parser :: internal sexp -> WispAbstractSyntax */

wisp.parseIsNumber = function(sexp) {
    return ! isNaN(parseFloat(sexp));
};
wisp.parseIsBoolean = function(sexp) {
    return sexp === "true" || sexp === "false";
};
wisp.parseIsString = function(sexp) {
    return sexp[0] === "\"" && sexp[sexp.length - 1] === "\"";
};

wisp.parse = function(sexp) {
    if (wisp.parseIsNumber(sexp)) {
        return {
            type: "num",
            val: parseFloat(sexp)
        };
    }
    else if (wisp.parseIsBoolean(sexp)) {
        return {
            type: "bool",
            val: sexp === "true"
        };
    }
    else if (wisp.parseIsString(sexp)) {
        return {
            type: "string",
            val: sexp.substring(1, sexp.length - 1)
        };
    }
    else if (wisp.isSymbol(sexp)) {
        return {
            type: "sym",
            val: sexp
        };
    }
    else if (wisp.isCons(sexp)) {
        switch (wisp.first(sexp)) {
        case "let":
            // this could be done in a later macro? e.g. make let a macro
            // turn substitution into function application
            return {
                type:
                "app",
                funExpr:
                {
					type: "lambda",
                    params: wisp.firsts(wisp.second(sexp)),
                    body: wisp.parse(wisp.third(sexp))
                },
                argsExpr: {
                    type: "argList",
                    val: wisp.parseArgs(wisp.seconds(wisp.second(sexp)))
                }
            };
        case "lambda":
            return {
                type:
                "lambda",
                params: wisp.second(sexp),
                body: wisp.parse(wisp.third(sexp))
            };
        case "cond":
            return {
                type:
                "cond",
                val: wisp.parseArgs(wisp.rest(sexp))
            };
		case "def":
			return {
				type: "def",
				param: wisp.second(sexp),
				body: wisp.parse(wisp.third(sexp))
			};
        default:
            return {
                type:
                "app",
                funExpr: wisp.parse(wisp.first(sexp)),
                argsExpr: {
                    type: "argList",
                    val: wisp.parseArgs(wisp.rest(sexp))
                }
            };
        }
    }
    else {
        throw "Parse Error: Given s-expression neither number, symbol, or cons";
    }
};

wisp.parseArgs = function(list) {
    if (wisp.isEmpty(list)) return list;
    return wisp.cons(wisp.parse(wisp.first(list)), wisp.parseArgs(wisp.rest(list)));
};

wisp.envLookup = function(symbol, env) {
    var val = env[symbol];
    if (val === undefined) {
        throw "given symbol name '" + symbol + "' not in environment";
    }
    else {
        return val;
    }
};

wisp.interpArgs = function(args, env) {
    if (wisp.isEmpty(args)) return args;
    return wisp.cons(wisp.interp(wisp.first(args), env), wisp.interpArgs(wisp.rest(args), env));
};

wisp.interpCond = function(args, env) {
    wisp.lastArgs = args;
    if (wisp.isEmpty(args)) return args;
    var cond = wisp.interp(wisp.first(args).funExpr, env);
    if (!wisp.isBoolean(cond)) throw "Error in evaluating condition: " + cond + " is not a boolean";
    if (cond) return wisp.first(wisp.interp(wisp.first(args).argsExpr, env));
    else return wisp.interpCond(wisp.rest(args), env);
};

wisp.addArgsToEnv = function(params, args, startingEnv) {
    if (wisp.isEmpty(params)) {
        startingEnv['argslist'] = args;
        return startingEnv;
    }
    else if (wisp.isEmpty(args)) {
        throw "Wisp error: insufficient number of arguments given";
    }
    else {
        var env, sym = wisp.first(params),
        val = wisp.first(args);
        env = wisp.addArgsToEnv(wisp.rest(params), wisp.rest(args), startingEnv);
        env[sym] = val;
        return env;
    }
};

/* parsed abstract wisp syntax => final value (number, closure) */
wisp.interp = function(expr, env) {
    var closure, args, paramsList, val, newEnv;
    switch (expr.type) {
    case "num":
        return expr.val;
    case "bool":
        return expr.val;
    case "string":
        return expr.val;
    case "sym":
        return wisp.envLookup(expr.val, env);
    case "argList":
        return wisp.interpArgs(expr.val, env);
    case "cond":
        return wisp.interpCond(expr.val, env);
	case "def":
		env[expr.param] = wisp.interp(expr.body, env);
		return expr.param;
    case "lambda":
        // create and return a closure
        closure = function(args) {
            return wisp.interp(expr.body, wisp.addArgsToEnv(expr.params, args, env));
        };
        return closure;
    case "app":
        closure = wisp.interp(expr.funExpr, env);
        args = wisp.interp(expr.argsExpr, env);
        return closure(args);
    default:
        throw "Interpreter error, unknown abstract syntax type";
    }
};

wisp.basicEnv = {
    // arithmetic
    "+": function(args) {
        if (wisp.isEmpty(args)) return 0;
        return wisp.first(args) + arguments.callee(wisp.rest(args));
    },

    "-": function(args) {
        if (wisp.isEmpty(args)) return 0;
        return wisp.first(args) - arguments.callee(wisp.rest(args));
    },

	"*": function(args) {
        if (wisp.isEmpty(args)) return 1;
        return wisp.first(args) * arguments.callee(wisp.rest(args));
    },

	"/": function(args) {
        if (wisp.isEmpty(args)) return 1;
        return wisp.first(args) / arguments.callee(wisp.rest(args));
    },

	"%": function(args){
		// only defined for two operators
		return wisp.first(args) % wisp.second(args);
	},
    // list manipulation
    "list": function(args) {
        return args;
    },
    "first": function(args) {
        return wisp.first(wisp.first(args));
    },
    "car": function(args) {
        return wisp.first(wisp.first(args));
    },
    "rest": function(args) {
        return wisp.rest(wisp.first(args));
    },
    "cdr": function(args) {
        return wisp.rest(wisp.first(args));
    },
    "cons": function(args) {
        return wisp.cons(wisp.first(args), wisp.second(args));
    },
    "cons?": function(args) {
        return wisp.isCons(wisp.first(args));
    },
	"list?": function(args) {
        return wisp.isCons(wisp.first(args));
    },
    "atom?": function(args) {
        return wisp.isAtom(wisp.first(args));
    },
    "empty": wisp.empty,
    "empty?": function(args) {
        return wisp.isEmpty(wisp.first(args));
    },
    "eq?": function(args) {
        var first = wisp.first(args),
        second = wisp.second(args);
        if (wisp.isAtom(first) && wisp.isAtom(second)) {
            return first === second;
        }
        else if (wisp.isCons(first) && wisp.isCons(second)) {
            var firsts = [wisp.first(first), wisp.first(second)].toWispSexp();
            var rests = [wisp.rest(first), wisp.rest(second)].toWispSexp();
            return arguments.callee(firsts) && arguments.callee(rests);
        }
        else {
            return false;
        }
    },
    // types
    "number?": function(args) {
        return wisp.isNumber(wisp.first(args));
    },
    "boolean?": function(args) {
        return wisp.isBoolean(wisp.first(args));
    },
    "string?": function(args) {
        return wisp.isSymbol(wisp.first(args));
    },
    // control structures
    "else": true
};

//
// Get all <link> tags with the 'rel' attribute set to "script/wisp"
// Modified from less.js (http://github.com/cloudhead/less.js)
//
var links = document.getElementsByTagName('link');
var typePattern = /^text\/(x-)?wisp$/;

wisp.scripts = [];

var i;
for (i = 0; i < links.length; i++) {
    if (links[i].rel === 'script/wisp' || (links[i].rel.match(/script/) && links[i].type.match(typePattern))) {
        wisp.scripts.push(links[i]);
    }
}

var val, sexps = [], parsed = [], env = wisp.basicEnv, advance = {'index': 0 };
// for now just get first one, fetch it and interpret it
$.get(wisp.scripts[0].href,
function(wispScript) {
	wispScript = wispScript.trim();
	while (advance['index'] < wispScript.length){
		sexps.push(wisp.read(wispScript, advance));
	}
	for (i = 0; i < sexps.length; i ++){
		val = wisp.interp(wisp.parse(sexps[i]), env);
	}
    console.log(val);
    var str = wisp.isCons(val) ? val.toWispString() : val;
    $("body").html("Wisp script returned: " + str);
});
