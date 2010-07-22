/**
Wisp: Web-Lisp, a lisp dialect interpreted in javascript.

Copyright (c) 2010 Paul Lambert

Licensed under the MIT license, included by reference: http://www.opensource.org/licenses/mit-license.php

**/

/****** Core Wisp
Core Wisp data structures and internal functions for manipulating lists
used by the interpreter.
******/

var wisp = {};
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
wisp.append2 = function(list1, list2) {
    if (!wisp.isCons(list1) || !wisp.isCons(list2)) throw "Wisp error: both arguments to append must be lists";
    if (wisp.isEmpty(list1)) return list2;
    return wisp.cons(wisp.first(list1), wisp.append2(wisp.rest(list1), list2));
};
wisp.first = function(list) {
    if (!wisp.isNonEmptyCons(list)) {
        throw "Wisp error: first is only defined for non-empty lists";
    }
    return list[0];
};
wisp.second = function(list) {
    return wisp.first(wisp.rest(list));
};
wisp.third = function(list) {
    return wisp.first(wisp.rest(wisp.rest(list)));
};
wisp.firsts = function(list) {
    if (wisp.isEmpty(list)) return list;
    return wisp.cons(wisp.first(wisp.first(list)), wisp.firsts(wisp.rest(list)));
};
wisp.seconds = function(list) {
    if (wisp.isEmpty(list)) return list;
    return wisp.cons(wisp.second(wisp.first(list)), wisp.seconds(wisp.rest(list)));
};
wisp.rest = function(list) {
    if (!wisp.isNonEmptyCons(list)) throw "Wisp error: rest is only defined for non-empty lists";
    return list[1];
};

// creates nicely formatted representations of lists for printing 
Array.prototype.toWispString = function() {
    return this._toWispString(true);
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

/****** End Core Wisp ******/

/****** Reader
<document>
******/

wisp.EOF = {
    type: "EOF"
};
wisp.EOL = {
    type: "EOL" // end of line
};
wisp.COMMENT = {
	type: "Comment"
};

wisp.read = function(wispScript, advance) {
    if (advance === undefined) {
        advance = {
            'index': 0
        };
    }
    var arrd = wisp._readIntoArray(wispScript, advance);
    return (arrd instanceof Array) ? arrd.toWispSexp() : arrd;
};
wisp._readIntoArray = function(wispScript, advance) {
    if (wispScript.length === 0 || wispScript.length <= advance['index']) return wisp.EOF;
    var upToHere = wispScript.substring(advance['index']);
    var nextChar = upToHere.trim()[0];
    var token, pos;
    switch (nextChar) {
    case ")":
        advance['index'] += upToHere.indexOf(")") + 1;
        return wisp.EOL;
    case "(":
        advance['index'] += upToHere.indexOf("(") + 1;
        var val, sexp = [];
        while (true) {
            val = wisp._readIntoArray(wispScript, advance);
			if (val === wisp.COMMENT) continue;
            if (val === wisp.EOL) break;
            if (val === wisp.EOF) throw "Error: end of file reached without reaching list end";
            sexp.push(val);
        }
        return sexp;
    case "\"":
        //string
        pos = upToHere.substring(1).search(/[^\\]"/) + 3; //once for substring(1), twice for two char regex
        token = upToHere.substring(0, pos).trim();
        advance['index'] += pos;
        return token;
    case ";":
		//single until-end-of-line comment
        pos = (upToHere.search(/\n/) + 1) || wispScript.length;
        advance['index'] += pos;
        return wisp.COMMENT;
    default:
        var closeParen, whiteSpace, endOfToken;
        closeParen = upToHere.indexOf(")");
        if (closeParen === -1) closeParen = Infinity;
        whiteSpace = upToHere.search(/\S\s/) + 1;
        if (whiteSpace < 1) whiteSpace = (wispScript.length - advance['index']);
        endOfToken = (closeParen < whiteSpace) ? closeParen: whiteSpace;
        token = wispScript.substring(advance['index'], advance['index'] + endOfToken).trim();
        advance['index'] += endOfToken;
        return token;
    }
};
// converts array (such as that produced by _readIntoArray) into wisp sexp
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

/****** End Reader ******/

/****** Parser
Parser :: read-produced sexp -> WispAbstractSyntax
******/

wisp.parseIsNumber = function(sexp) {
    return ! isNaN(parseFloat(sexp));
};
wisp.parseIsBoolean = function(sexp) {
    return sexp === "true" || sexp === "false";
};
wisp.parseIsString = function(sexp) {
    return sexp[0] === "\"" && sexp[sexp.length - 1] === "\"";
};
wisp.parseArgs = function(list) {
    if (wisp.isEmpty(list)) return list;
    return wisp.cons(wisp.parse(wisp.first(list)), wisp.parseArgs(wisp.rest(list)));
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
                funExpr: {
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
                type:
                "def",
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

/****** End Parser ******/

/****** Interpreter
<document>
******/

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
wisp.envLookup = function(symbol, env) {
    var val = env[symbol];
    if (val === undefined) {
        throw "given symbol name '" + symbol + "' not in environment";
    }
    else {
        return val;
    }
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
        val = wisp.interp(expr.body, env);
        env[expr.param] = val;
        if (typeof val === "object" && val.type && val.type === "closure") {
            // give self reference to allow for recursion
            val.savedEnv[expr.param] = val;
        }
        return expr.param;
    case "lambda":
        // create and return a closure
        newEnv = $.extend({},
        env); // shallow copy, will need to extend for namesspaces, function re-definition
        return {
            type: "closure",
            body: expr.body,
            params: expr.params,
            savedEnv: newEnv
        };
    case "app":
        closure = wisp.interp(expr.funExpr, env);
        args = wisp.interp(expr.argsExpr, env);
        if (typeof closure === "function") {
            return closure(args);
        }
        return wisp.interp(closure.body, wisp.addArgsToEnv(closure.params, args, closure.savedEnv));
    default:
        throw "Interpreter error, unknown abstract syntax type";
    }
};

/****** End Interpreter ******/

/****** Primitives: functions and operations
<document>
******/

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

    "%": function(args) {
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
    "rest": function(args) {
        return wisp.rest(wisp.first(args));
    },
    "cons": function(args) {
        return wisp.cons(wisp.first(args), wisp.second(args));
    },
    "list?": function(args) {
        return wisp.isCons(wisp.first(args));
    },
    "atom?": function(args) {
        return wisp.isAtom(wisp.first(args));
    },
    "empty?": function(args) {
        return wisp.isEmpty(wisp.first(args));
    },
    "eq?": function(args) {
        var first = wisp.first(args),
        second = wisp.second(args);
        if (wisp.isAtom(first) && wisp.isAtom(second)) {
            return first === second;
        }
        else if (wisp.isEmpty(first) && wisp.isEmpty(second)) {
            return true;
        }
        else if (wisp.isNonEmptyCons(first) && wisp.isNonEmptyCons(second)) {
            var firsts = wisp.cons(wisp.first(first), wisp.cons(wisp.first(second), wisp.empty));
            if (wisp.isEmpty(wisp.rest(first)) && wisp.isEmpty(wisp.rest(second))) {
                return arguments.callee(firsts);
            }
            var rests = wisp.cons(wisp.rest(first), wisp.cons(wisp.rest(second), wisp.empty));
            return arguments.callee(firsts) && arguments.callee(rests);
        }
        else {
            return false;
        }
    },
    "append": function(args) {
        if (wisp.isEmpty(wisp.rest(args))) return wisp.first(args);
        return wisp.append2(wisp.first(args), arguments.callee(wisp.rest(args)));
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
    // pass through functions
    "log": function(args) {
        console.log(args.toWispString());
        return args;
    }
};

/****** End Primitives ******/

/****** Browser Support
<document>
******/

// Get all <link> tags with the 'rel' attribute set to "script/wisp"
// Modified from less.js (http://github.com/cloudhead/less.js)
wisp.scripts = [];
var i, links = document.getElementsByTagName('link'),
 	typePattern = /^text\/(x-)?wisp$/;
for (i = 0; i < links.length; i++) {
    if (links[i].rel === 'script/wisp' || (links[i].rel.match(/script/) && links[i].type.match(typePattern))) {
        wisp.scripts.push(links[i]);
    }
}

// Read and intert each script in order
var val, advance, read, sexps, env = wisp.basicEnv, scriptIndex = 0;
wisp.readNextScript = function() {
    $.get(wisp.scripts[scriptIndex].href,
    function(wispScript) {
        // wispScript = wisp.removeCommentLines(wispScript).trim();
		wispScript = wispScript.trim();
        advance = {
            'index': 0
        };
        sexps = [];
        while (advance['index'] < wispScript.length) {
			read = wisp.read(wispScript, advance);
			if (read !== wisp.COMMENT && read !== wisp.EOF){
				sexps.push(read);
			}
        }
        for (i = 0; i < sexps.length; i++) {
            val = wisp.interp(wisp.parse(sexps[i]), env);
        }
        var str = wisp.isCons(val) ? val.toWispString() : val;
        console.log(wisp.scripts[scriptIndex].href + " returned:  \n" + str);
        $("body").html("Wisp script returned: " + str);
        scriptIndex++;
        if (scriptIndex < wisp.scripts.length) {
            wisp.readNextScript();
        }
    });
};

if (wisp.scripts.length > 0) wisp.readNextScript();
