Wisp: Web-Lisp, a lisp interpreted by javascript at runtime.

Allows you to program your browser in wisp instead of javascript. Just add a link tag with rel="script/wisp" to your wisp files *before* the script tag to include the wisp interpreter.
The interpreter will pickup all the linked wisp scripts and run them on page load. 

## Example
(from repl.html)

	<head>
	...
		<link rel="script/wisp" href="stdlib.wisp" type="text/wisp" />
		<link rel="script/wisp" href="repl.wisp" type="text/wisp" />
		<script type="text/javascript" src="wisp.js"></script>
	
	</head>
	
(on page load all code in stdlib.wisp and then repl.wisp will be run and interpreted)

## Features
Wisp is still very much under development as a side project. That said current features include

* First-class functions 
* First-class macros (macros can be stored in data structures, passed as values, returned by functions/macros)
* Simple wisp-to-js interface
* Miniminalist core functions and syntax, emphasis on small, orthogonal feature set. Lisp syntax primarily
inspired by Scheme with some clojure/CL mixed in. 
* variable arguments with &rest syntax. e.g. ((lambda (one two &three) (...body...)) 1 2 3 4 5 6)
in body, bindings will be: one => 1, two => 2, three => (3 4 5 6)

## Using
At your own risk! ;)

Currently loading the repl off my harddrive does not work in Chrome because of a Access-Control-Allow-Origin exception. Works fine in Safari 5 and Firefox 3.6.

See the examples folder for syntax and examples. For editor/IDE support you should be able to use Scheme modes (highlighting, etc...) as a decent substitute.

Open resources/repl.html to play around. Error messages are currently logged to the javascript console, not the repl, so have your js console open as well if things look like they are breaking.
In the repl you can do fun things like
	
	wisp>(+ 1 2 3 4)
	=> 10
	
or a bit more interesting
	
	;; define a greeting function
	(def hello (lambda (name) (+ "Hello " name "!")))
	;; define a string variable
	(def globe "World")
	;; create a closure over globe and hello to produce "Hello World" when called
	(def hello-world (lambda () (hello globe)))
	;; define a higher-order function that calls the passed
	;; function a given number of times, appending to returned value
	;; to the body of your html document
	(def callN (lambda (func numTimes) 
		(if (< numTimes 1) 
			'() 
			(seq (append-body (func)) (callN func (- numTimes 1))))))
	;; Add "Hello World" to the body of your html document 5 times
	(callN hello-world 5)
	

