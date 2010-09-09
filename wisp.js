/**
Wisp: Web-Lisp, a lisp dialect interpreted in javascript.

Copyright (c) 2010 Paul Lambert

Licensed under the MIT license, included by reference: http://www.opensource.org/licenses/mit-license.php

**/

/****** Core Wisp
Core Wisp data structures and internal functions for manipulating lists.
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
wisp.first = function(list) {
    if (!wisp.isNonEmptyCons(list)) {
        throw "Wisp error: first is only defined for non-empty lists";
    }
    return list[0];
};
wisp.rest = function(list) {
    if (!wisp.isNonEmptyCons(list)) throw "Wisp error: rest is only defined for non-empty lists";
    return list[1];
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
wisp.append = function(list1, list2) {
    if (!wisp.isCons(list1) || !wisp.isCons(list2)) throw "Wisp error: both arguments to append must be lists";
    if (wisp.isEmpty(list1)) return list2;
    return wisp.cons(wisp.first(list1), wisp.append(wisp.rest(list1), list2));
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
Consumes strings representing wisp s-expressions and produces corresponding internal list structures
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
        var begin = upToHere.indexOf(nextChar);
        pos = upToHere.substring(begin).search(/[^\\]"/) + begin + 2; //twice for two char regex
        token = upToHere.substring(0, pos).trim();
        advance['index'] += pos;
        return token;
    case "'":
        //quote
        advance['index'] += upToHere.indexOf("'") + 1;
        token = wisp._readIntoArray(wispScript, advance);
        return ["quote", token];
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

/****** End Reader ******/

/****** Interpreter
Consumes list structures produced by the reader and produces values: basic types, or functions
******/

/** Parsing Helpers **/
wisp.parseIsNumber = function(sexp) {
    return ! isNaN(parseFloat(sexp));
};
wisp.parseIsBoolean = function(sexp) {
    return sexp === "true" || sexp === "false";
};
wisp.parseIsString = function(sexp) {
    return ((typeof sexp) === "string") && sexp[0] === "\"" && sexp[sexp.length - 1] === "\"";
};
wisp.parseTypes = function(sexp) {
    if ((typeof sexp) === "string") {
        if (wisp.parseIsNumber(sexp)) {
            return parseFloat(sexp);
        }
        else if (wisp.parseIsBoolean(sexp)) {
            return sexp === "true";
        }
        else if (wisp.parseIsString(sexp)) {
            return sexp.substring(1, sexp.length - 1).replace("\\\"", "\"");
        }
        else if (wisp.isSymbol(sexp)) {
            return sexp;
        }
    }
    else if (wisp.isCons(sexp)) {
        if (wisp.isEmpty(sexp)) return sexp;
        else return wisp.cons(wisp.parseTypes(wisp.first(sexp)), wisp.parseTypes(wisp.rest(sexp)));
    }
    else {
        throw "Parse Error: Given s-expression neither basic data type or cons";
    }
};
/** End Parsing Helpers **/

/** Interp Logic Helpers **/
wisp.interpArgs = function(args, env) {
    if (wisp.isEmpty(args)) return args;
    return wisp.cons(wisp.interp(wisp.first(args), env), wisp.interpArgs(wisp.rest(args), env));
};
wisp.interpCond = function(args, env) {
    if (wisp.isEmpty(args)) return args;
    var cond = wisp.interp(wisp.first(wisp.first(args)), env);
    if (!wisp.isBoolean(cond)) throw "Error in evaluating condition: " + cond + " is not a boolean";
    if (cond) return wisp.interp(wisp.second(wisp.first(args)), env);
    else return wisp.interpCond(wisp.rest(args), env);
};

wisp.envSet = function(param, val, env) {
    var ns = env[env['__currentNamespace']];
    ns[param] = val;
};
wisp.envLookup = function(symbol, env) {
    var val;
    // look in current namespaces
    var i, cn = env['__currentNamespace'];
    for (i = 0; i < (cn.length && val === undefined); i++) {
        val = env[cn][symbol];
    }
    // then look in global namespaces
    if (val === undefined) val = env[symbol];

    if (val === undefined) {
        throw "given symbol name '" + symbol + "' not in environment";
    }
    else {
        return val;
    }
};
wisp.copyEnv = function(oldEnv) {
    var newEnv, i, spaces = oldEnv['__allNamespaces'];
    newEnv = $.extend({},
    oldEnv); // shallow copy, will need to extend for namesspaces
    for (i = 0; i < spaces.length; i++) {
        newEnv[spaces[i]] = $.extend({},
        oldEnv[spaces[i]]);
    }
    return newEnv;
};
wisp.addArgsToEnv = function(params, args, startingEnv) {
    if (wisp.isEmpty(params)) {
        wisp.envSet('_argslist', args, startingEnv);
        return startingEnv;
    }
    else if (wisp.isEmpty(args)) {
        console.log("somethings wrong!, params:" + params);
        throw "Wisp error: insufficient number of arguments given";
    }
    else {
        var env, sym = wisp.first(params),
        val = wisp.first(args);
        env = wisp.addArgsToEnv(wisp.rest(params), wisp.rest(args), startingEnv);
        wisp.envSet(sym, val, env);
        return env;
    }
};

/** End Interp Logic Helpers **/

/* Main Interpreter: read-produced lists => wisp values */
wisp.interp = function(sexp, env) {
    var closure, args, paramsList, val, newEnv;
    if (wisp.parseIsNumber(sexp)) return parseFloat(sexp);
    else if (wisp.parseIsBoolean(sexp)) return sexp === "true";
    else if (wisp.parseIsString(sexp)) return sexp.substring(1, sexp.length - 1).replace(/\\"/g, "\"");
    else if (wisp.isSymbol(sexp)) return wisp.envLookup(sexp, env);
    else if (wisp.isCons(sexp)) {
        switch (wisp.first(sexp)) {
        case "let":
            // transform into function application
			args = wisp.seconds(wisp.second(sexp));
			var body = wisp.third(sexp);
			paramsList = wisp.firsts(wisp.second(sexp));
			var fun = wisp.cons("lambda", wisp.cons(paramsList, wisp.cons(body, wisp.empty)));
			return wisp.interp(wisp.cons(fun, args), env);
        case "quote":
            return wisp.parseTypes(wisp.second(sexp));
        case "lambda":
            newEnv = wisp.copyEnv(env);
            return {
                type: "closure",
                body: wisp.third(sexp),
                params: wisp.second(sexp),
                savedEnv: newEnv
            };
        case "cond":
            return wisp.interpCond(wisp.rest(sexp), env);
        case "def":
            val = wisp.interp(wisp.third(sexp), env);
            wisp.envSet(wisp.second(sexp), val, env);
            if (typeof val === "object" && val.type && val.type === "closure") {
                // give self reference to allow for recursion
                wisp.envSet(wisp.second(sexp), val, val.savedEnv);
            }
            return wisp.second(sexp);
        default:
            // function application
            closure = wisp.interp(wisp.first(sexp), env);
            args = wisp.interpArgs(wisp.rest(sexp), env);
            if (typeof closure === "function") {
                return closure(args, env);
            }
            else if (typeof closure === "object" && closure.type && closure.type === "closure") {
                return wisp.interp(closure.body, wisp.addArgsToEnv(closure.params, args, closure.savedEnv));
            }
			throw "Function expression is invalid: " + closure;
        }
    }
    else {
        throw "Wisp Error: Given s-expression " + sexp + " of unknown type";
    }
};

/****** End Interpreter ******/

/****** Primitives: functions and operations
<document>
******/

wisp.basicEnv = {
    '__currentNamespace': "default",
    '__allNamespaces': ["default"],
    // Global Namespace
    // arithmetic 
    // both addition and concatenation
    "+": function(args) {
        return wisp.isEmpty(wisp.rest(args)) ? wisp.first(args) : wisp.first(args) + arguments.callee(wisp.rest(args));
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
        return wisp.append(wisp.first(args), arguments.callee(wisp.rest(args)));
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
        if (wisp.isEmpty(args)) return wisp.empty;
        else {
            console.log(wisp.first(args));
            return wisp.cons(wisp.first(args), arguments.callee(wisp.rest(args)));
        }
    },

    // pass through functions
    "split": function(args) {
        var split_array = wisp.second(args).split(wisp.first(args));
        return split_array.toWispSexp();
    },

    "write": function(args) {
        document.write(wisp.first(args));
        return wisp.isEmpty(wisp.rest(args)) ? wisp.first(args) : arguments.callee(wisp.rest(args));
    },

    "append-body": function(args) {
        $("body").append(wisp.first(args));
        return wisp.isEmpty(wisp.rest(args)) ? wisp.first(args) : arguments.callee(wisp.rest(args));
    },

    "writeln": function(args) {
        document.writeln(wisp.first(args));
        return wisp.isEmpty(wisp.rest(args)) ? wisp.first(args) : arguments.callee(wisp.rest(args));
    },

    // default namespace used for user definitions
    "default": {},
    "set-ns": function(args, env) {
        var i, name = wisp.first(args),
        found = false,
        spaces = env['__allNamespaces'];
        for (i = 0; i < spaces.length; i++) {
            if (spaces[i] === name) {
                found = true;
                break;
            }
        }
        if (!found) {
            if (!wisp.isSymbol(name)) throw "namespace must be a string";
            env[name] = {};
            spaces.push(name);
        }
        env['__currentNamespace'] = name;
        return name;
    },
    "get-ns": function(args, env) {
        return env['__currentNamespace'];
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

// Read and interp each script in order
var val, advance, read, sexps, env = wisp.basicEnv,
scriptIndex = 0;
wisp.readNextScript = function() {
    $.get(wisp.scripts[scriptIndex].href,
    function(wispScript) {
        wispScript = wispScript.trim();
        advance = {
            'index': 0
        };
        sexps = [];
        while (advance['index'] < wispScript.length) {
            read = wisp.read(wispScript, advance);
            if (read !== wisp.COMMENT && read !== wisp.EOF) {
                sexps.push(read);
            }
        }
        for (i = 0; i < sexps.length; i++) {
            val = wisp.interp(sexps[i], env);
        }
        var str = wisp.isCons(val) ? val.toWispString() : val;
        console.log(wisp.scripts[scriptIndex].href + " returned:  \n" + str);
        scriptIndex++;
        if (scriptIndex < wisp.scripts.length) {
            wisp.readNextScript();
        }
    });
};

if (wisp.scripts.length > 0) wisp.readNextScript();

/****** End Browser Support ******/

