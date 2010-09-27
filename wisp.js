/**
Wisp: Web-Lisp, a lisp dialect interpreted in javascript.

Licensed under the MIT license, reference: http://www.opensource.org/licenses/mit-license.php

Copyright (c) 2010 Paul Lambert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

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
wisp.isString = function(val) {
    return ((typeof val) === "string");
};
wisp.isBoolean = function(val) {
    return ((typeof val) === "boolean");
};
wisp.isAbstractNumber = function(val) {
    return (typeof val === "object") && val.type && val.type === "number";
};
wisp.isAbstractString = function(val) {
    return (typeof val === "object") && val.type && val.type === "string";
};
wisp.isAbstractBoolean = function(val) {
    return (typeof val === "object") && val.type && val.type === "bool";
};
wisp.isAbstractIdentifier = function(val) {
    return (typeof val === "object") && val.type && val.type === "id";
};
wisp.isAbstractLambdaClosure = function(val) {
    return (typeof val === "object") && val.type && val.type === "lambdaClosure";
};
wisp.isAbstractMacroClosure = function(val) {
    return (typeof val === "object") && val.type && val.type === "macroClosure";
};
wisp.verifyNumber = function(val) {
    if (!wisp.isAbstractNumber(val)) throw "Type Error: " + val.toString() + " is not a number";
    return val;
};
wisp.verifyString = function(val) {
    if (!wisp.isAbstractString(val)) throw "Type Error: " + val.toString() + " is not a string";
    return val;
};
wisp.verifyBoolean = function(val) {
    if (!wisp.isAbstractBoolean(val)) throw "Type Error: " + val.toString() + " is not a boolean";
    return val;
};
wisp.verifyIdentifier = function(val) {
    if (!wisp.isAbstractIdentifier(val)) throw "Type Error: " + val.toString() + " is not an identifier";
    return val;
};
wisp.verifyLambdaClosure = function(val) {
    if (!wisp.isAbstractLambdaClosure(val)) throw "Type Error: " + val.toString() + " is not a function";
    return val;
};
wisp.verifyMacroClosure = function(val) {
    if (!wisp.isAbstractMacroClosure(val)) throw "Type Error: " + val.toString() + " is not a macro";
    return val;
};
wisp.isAtom = function(val) {
    return wisp.isNumber(val) || wisp.isBoolean(val) || wisp.isString(val);
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
    if (!wisp.isNonEmptyCons(list)) {
        throw "Wisp error: rest is only defined for non-empty lists";
    }
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
    if (start) str = "(list ";
    str += wisp.isCons(first) ? first._toWispString(true) : first.toString();
    restStr = wisp.rest(this)._toWispString(false);
    str += (restStr === "") ? "": " ";
    str += restStr;
    if (start) str = str + ")";
    return str;
};
// override default toString
Array.prototype.toString = Array.prototype.toWispString;
/****** End Core Wisp ******/

/****** Reader
Consumes strings representing wisp s-expressions and produces corresponding internal list structures
******/

wisp.EOF = {
    type: "EOF"
};
wisp.EOL = {
    type: "EOL" // end of list, not line
};
wisp.COMMENT = {
    type: "Comment"
};

/** Converts array (such as that produced by _readIntoArray) into wisp sexp
	inspired by similar function in http://onestepback.org/index.cgi/Tech/Ruby/LispInRuby.red
*/
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

/**	Consumes program text as a string and and option advance object indicating where in the string
	to begin reading.
	Produces wisp list of string tokens with the list structure mirroring that given in the program text.
*/
wisp.read = function(wispScript, advance) {
    if (advance === undefined) {
        advance = {
            'index': 0,
            'lineNumber': 1
        };
    }
    var asArrays = wisp._readIntoArray(wispScript, advance);
    return (asArrays instanceof Array) ? asArrays.toWispSexp() : asArrays;
};

/**	Helper function for wisp.read. Produces a intermediary where the string tokens are stored in
	an array, not a list. For example the text "(this is not (a (list)))" would produce the
	equivalent to the javascript literal ["this", "is", "not", ["a", ["list"]]]

	Also expands some 'syntaxtic sugar', for example "~name" becomes ["unquote", "name"]
*/
wisp._readIntoArray = function(wispScript, advance) {
    if (wispScript.length === 0 || wispScript.length <= advance['index']) return wisp.EOF;
    var upToHere = wispScript.substring(advance['index']);
    var nextChar = upToHere.trim()[0];
    var nextCharIndex = upToHere.indexOf(nextChar);
    var token, pos;
    switch (nextChar) {
    case ")":
        // End of list, advance index past the character and return end of list constant
        advance['index'] += nextCharIndex + 1;
        return wisp.EOL;
    case "(":
        // Start of list, recursively read in each element until we reach the end of the list
        advance['index'] += nextCharIndex + 1;
        var val, sexp = [];
        while (true) {
            val = wisp._readIntoArray(wispScript, advance);
            if (val === wisp.COMMENT) continue;
            if (val === wisp.EOL) break;
            if (val === wisp.EOF) throw "Error: end of file reached without reaching end of list";
            sexp.push(val);
        }
        return sexp;
    case "\"":
        //string case needed to simply default token extraction (whitespace is ignored, we only look for closing ")
        pos = upToHere.substring(nextCharIndex).search(/[^\\]"/) + nextCharIndex + 2; //twice for two char regex
        token = upToHere.substring(0, pos).trim();
        advance['index'] += pos;
        return wisp.tokenToAbstractSyntax(token);
    case "'":
        //quote
        advance['index'] += nextCharIndex + 1;
        token = wisp._readIntoArray(wispScript, advance);
        return [wisp.tokenToAbstractSyntax("quote"), token];
    case "`":
        //backquote
        advance['index'] += nextCharIndex + 1;
        token = wisp._readIntoArray(wispScript, advance);
        return [wisp.tokenToAbstractSyntax("backquote"), token];
    case "~":
        //unquote and unquote-splice
        if (upToHere[nextCharIndex + 1] == "@") {
            advance['index'] += nextCharIndex + 2;
            token = wisp._readIntoArray(wispScript, advance);
            return [wisp.tokenToAbstractSyntax("unquote-splice"), token];
        }
        advance['index'] += nextCharIndex + 1;
        token = wisp._readIntoArray(wispScript, advance);
        return [wisp.tokenToAbstractSyntax("unquote"), token];
    case ";":
        //single until-end-of-line comment
        pos = (upToHere.search(/\n/) + 1) || wispScript.length;
        advance['index'] += pos;
        return wisp.COMMENT;
    default:
        // Default action is to read a single string token. Knowing that we are not at the 
        // start of a list, a token is simply the substring starting from where we currently are (upToHere)
        // and ending at the soonest of whitespace or a closing paranthesis.
        var closeParen, whiteSpace, endOfToken;
        closeParen = upToHere.indexOf(")");
        if (closeParen === -1) closeParen = Infinity;
        whiteSpace = upToHere.search(/\S\s/) + 1;
        if (whiteSpace === 0) whiteSpace = (wispScript.length - advance['index']); // relative index of end of file
        endOfToken = (closeParen < whiteSpace) ? closeParen: whiteSpace;
        token = upToHere.substring(0, endOfToken).trim();
        advance['index'] += endOfToken;
        return wisp.tokenToAbstractSyntax(token);
    }
};
wisp.tokenToAbstractSyntax = function(tokenString) {
    var tokenObject = {};
    if (wisp.parseIsNumber(tokenString)) {
        tokenObject.type = "number";
        tokenObject.value = parseFloat(tokenString);
        tokenObject.toString = function() {
            return this.value + "";
        };
    }
    else if (wisp.parseIsBoolean(tokenString)) {
        tokenObject.type = "bool";
        tokenObject.value = tokenString === "true";
        tokenObject.toString = function() {
            return this.value + "";
        };
    }
    else if (wisp.parseIsString(tokenString)) {
        tokenObject.type = "string";
        tokenObject.value = tokenString.substring(1, tokenString.length - 1).replace(/\\"/g, "\""); //strip quotes and escapes
        tokenObject.toString = function() {
            return '"' + this.value + '"';
        };
    }
    else {
        // identifier
        tokenObject.type = "id";
        tokenObject.value = tokenString;
        tokenObject.toString = function() {
            return "'" + this.value;
        };
    }
    return tokenObject;
};
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
/****** End Reader ******/

/****** Interpreter
Consumes list structures produced by the reader and produces values
******/

/** Interp Logic Helpers **/
wisp.interpArgs = function(args, env) {
    if (wisp.isEmpty(args)) return args;
    return wisp.cons(wisp.interp(wisp.first(args), env), wisp.interpArgs(wisp.rest(args), env));
};
wisp.interpCond = function(args, env) {
    if (wisp.isEmpty(args)) return args;
    var cond = wisp.interp(wisp.first(wisp.first(args)), env);
    wisp.verifyBoolean(cond);
    if (cond.value) return wisp.interp(wisp.second(wisp.first(args)), env);
    else return wisp.interpCond(wisp.rest(args), env);
};
wisp.interpSeq = function(exprList, env) {
    if (wisp.isEmpty(wisp.rest(exprList))) return wisp.interp(wisp.first(exprList), env);
    else {
        wisp.interp(wisp.first(exprList), env); // ignore return value
        return wisp.interpSeq(wisp.rest(exprList), env);
    }
};
wisp.interpWhile = function(condExpr, bodyExpr, env) {
    var lastVal, condition = wisp.verifyBoolean(wisp.interp(condExpr, env));
    lastVal = condition;
    while (condition.value === true) {
        lastVal = wisp.interp(bodyExpr, env);
        condition = wisp.interp(condExpr, env);
    }
    return lastVal;
};
wisp.interpQuote = function(sexp, env, isBackquote) {
    if (!wisp.isCons(sexp) || wisp.isEmpty(sexp)) return sexp;
    if (isBackquote) {
        var e1 = wisp.first(sexp);
        if (wisp.isAbstractIdentifier(e1) && e1.value === "unquote") {
            return wisp.interp(wisp.second(sexp), env);
        }
        if (wisp.isCons(e1) && wisp.isAbstractIdentifier(wisp.first(e1)) && wisp.first(e1).value === "unquote-splice") {
            var restList = wisp.interpQuote(wisp.rest(sexp), env, isBackquote);
            var spliceIn = wisp.interp(wisp.second(e1), env);
            return wisp.append(spliceIn, restList);
        }
    }
    return wisp.cons(wisp.interpQuote(wisp.first(sexp), env, isBackquote), wisp.interpQuote(wisp.rest(sexp), env, isBackquote));
};

wisp.envSet = function(id, val, env) {
    var ns = env[env['__currentNamespace']];
    var name = wisp.verifyIdentifier(id).value;
    ns[name] = val;
    return env;
};
wisp.envLookup = function(id, env) {
    var val;
    var name = wisp.verifyIdentifier(id).value;
    // look in current namespaces
    var i, cn = env['__currentNamespace'];
    for (i = 0; i < (cn.length && val === undefined); i++) {
        val = env[cn][name];
    }
    // then look in global namespaces
    if (val === undefined) val = env[name];

    if (val === undefined) {
        throw "Unbound identifier: " + name + " isn't defined in the current scope.";
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
        return startingEnv;
    }
    var nextParam = wisp.verifyIdentifier(wisp.first(params));
    if (nextParam.value[0] === "&") {
        var argsList = {};
        argsList.type = "id";
        argsList.value = nextParam.value.substring(1);
        argsList.toString = function() {
            return "'" + this.value;
        };
        wisp.envSet(argsList, args, startingEnv);
        return startingEnv;
    }
    else if (wisp.isEmpty(args)) {
        throw "Wisp error: insufficient number of arguments given";
    }
    else {
        var env, val = wisp.first(args);
        env = wisp.addArgsToEnv(wisp.rest(params), wisp.rest(args), startingEnv);
        wisp.envSet(nextParam, val, env);
        return env;
    }
};
wisp.macroExpand = function(macroExpr, args, env) {
    var macro = wisp.verifyMacroClosure(wisp.interp(macroExpr, env));
    return wisp.interp(macro.body, wisp.addArgsToEnv(macro.params, args, macro.savedEnv));
};
wisp.unboxAbstractSyntax = function(args) {
    if (wisp.isEmpty(args)) return args;
    var first = wisp.first(args);
    if (wisp.isAbstractNumber(first) || wisp.isAbstractString(first) || wisp.isAbstractBoolean(first)) {
        return wisp.cons(first.value, wisp.unboxAbstractSyntax(wisp.rest(args)));
    }
    else if (wisp.isAbstractIdentifier(first)) {
        // javascript has no native symbol/identifier type, so we pass in abstract syntax object itself
        return wisp.cons(first, wisp.unboxAbstractSyntax(wisp.rest(args)));
    }
    else if (wisp.isCons(first)) {
        return wisp.cons(wisp.unboxAbstractSyntax(first), wisp.unboxAbstractSyntax(wisp.rest(args)));
    }
    else throw "Unrecognized value " + first + " tried to be passed to native javascript function";
};
wisp.boxJavascriptValue = function(value) {
    var boxed = {};
    if (wisp.isBoolean(value)) {
        boxed.type = "bool";
        boxed.value = (value === true);
        boxed.toString = function() {
            return this.value + "";
        };
    }
    else if (wisp.isNumber(value)) {
        boxed.type = "number";
        boxed.value = value;
        boxed.toString = function() {
            return this.value + "";
        };
    }
    else if (wisp.isString(value)) {
        boxed.type = "string";
        boxed.value = value;
        boxed.toString = function() {
            return '"' + this.value + '"';
        };
    }
    else if (wisp.isAbstractIdentifier(value)) {
        return value;
    }
    else if (wisp.isCons(value)) {
        if (wisp.isEmpty(value)) return value;
        else return wisp.cons(wisp.boxJavascriptValue(wisp.first(value)), wisp.boxJavascriptValue(wisp.rest(value)));
    }
    else {
        boxed.type = "string";
        boxed.value = value + "";
        boxed.toString = function() {
            return '"' + this.value + '"';
        };
    }
    return boxed;
};
/** End Interp Logic Helpers **/

/* Main Interpreter: read-produced lists => wisp values */
wisp.interp = function(sexp, env) {
    var closure, first, args, paramsList, val, newEnv;
    if (wisp.isAbstractNumber(sexp) || wisp.isAbstractString(sexp) || wisp.isAbstractBoolean(sexp)) return sexp;
    else if (wisp.isAbstractIdentifier(sexp)) return wisp.envLookup(sexp, env);
    else if (wisp.isCons(sexp)) {
        first = wisp.first(sexp);
        if (wisp.isAbstractIdentifier(first)) {
            switch (first.value) {
            case "quote":
                return wisp.interpQuote(wisp.second(sexp), env, false);
            case "backquote":
                return wisp.interpQuote(wisp.second(sexp), env, true);
            case "unquote":
                throw "Wisp Error: Unquote must occur within a backquote";
            case "lambda":
                newEnv = wisp.copyEnv(env);
                return {
                    type: "lambdaClosure",
                    body: wisp.third(sexp),
                    params: wisp.second(sexp),
                    savedEnv: newEnv,
                    toString: function() {
                        return "(list 'lambda " + this.params.toString() + " " + this.body.toString() + ")";
                    }
                };
            case "macro":
                newEnv = wisp.copyEnv(env);
                return {
                    type: "macroClosure",
                    body: wisp.third(sexp),
                    params: wisp.second(sexp),
                    savedEnv: newEnv,
                    toString: function() {
                        return "(list 'macro " + this.params.toString() + " " + this.body.toString() + ")";
                    }
                };
            case "macroexpand":
                return wisp.macroExpand(wisp.first(wisp.first(wisp.rest(sexp))), wisp.rest(wisp.first(wisp.rest(sexp))), env);
            case "cond":
                return wisp.interpCond(wisp.rest(sexp), env);
            case "eval":
                var evald = wisp.interp(wisp.interp(wisp.first(wisp.rest(sexp)), env), env);
                return evald;
            case "def":
                val = wisp.interp(wisp.third(sexp), env);
                wisp.envSet(wisp.second(sexp), val, env);
                if (wisp.isAbstractLambdaClosure(val) || wisp.isAbstractMacroClosure(val)) {
                    // give self reference to allow for recursion
                    wisp.envSet(wisp.second(sexp), val, val.savedEnv);
                }
                return val;
            case "seq":
                return wisp.interpSeq(wisp.rest(sexp), env);
            case "while":
                return wisp.interpWhile(wisp.second(sexp), wisp.third(sexp), env);
            }
        }
        // haven't returned yet - default to function & macro application
        closure = wisp.interp(wisp.first(sexp), env);
        if (wisp.isAbstractLambdaClosure(closure)) {
            args = wisp.interpArgs(wisp.rest(sexp), env);
            return wisp.interp(closure.body, wisp.addArgsToEnv(closure.params, args, closure.savedEnv));
        }
        else if (wisp.isAbstractMacroClosure(closure)) {
            return wisp.interp(wisp.macroExpand(wisp.first(sexp), wisp.rest(sexp), env), env);
        }
        else if (typeof closure === "function") {
            // native js function, unbox args to types it can deal with: numbers, strings and booleans
            args = wisp.interpArgs(wisp.rest(sexp), env);
            val = closure(wisp.unboxAbstractSyntax(args), env);
            return wisp.boxJavascriptValue(val);
        }
        throw "Application expression is invalid (neither a function nor macro): " + closure;
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
    ">": function(args) {
        // only defined for two operators
        return wisp.first(args) > wisp.second(args);
    },
    ">=": function(args) {
        // only defined for two operators
        return wisp.first(args) >= wisp.second(args);
    },
    "<": function(args) {
        // only defined for two operators
        return wisp.first(args) < wisp.second(args);
    },
    "<=": function(args) {
        // only defined for two operators
        return wisp.first(args) <= wisp.second(args);
    },
    // boolean logic
    "not": function(args) {
        return ! wisp.first(args);
    },
    "and": function(args) {
        if (wisp.isEmpty(wisp.rest(args))) return wisp.first(args);
        else return wisp.first(args) && arguments.callee(wisp.rest(args));
    },
    "or": function(args) {
        if (wisp.isEmpty(wisp.rest(args))) return wisp.first(args);
        else return wisp.first(args) || arguments.callee(wisp.rest(args));
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
		else if (wisp.isAbstractIdentifier(first) && wisp.isAbstractIdentifier(second)) {
			return first.value === second.value;
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
    "read": function(args) {
        return wisp.read(wisp.first(args));
    },
    // types
    "number?": function(args) {
        return wisp.isNumber(wisp.first(args));
    },
    "boolean?": function(args) {
        return wisp.isBoolean(wisp.first(args));
    },
    "string?": function(args) {
        return wisp.isString(wisp.first(args));
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

    "random": function(args) {
        if (wisp.isEmpty(args)) return Math.random();
        else return Math.floor(Math.random() * wisp.first(args));
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
            if (!wisp.isString(name)) throw "namespace must be a string";
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
            'index': 0,
            'lineNumber': 1
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

