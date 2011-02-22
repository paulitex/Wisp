;; Want a basic 'class' like structure: a Dog class that has a name and can bark.
;; We want getters/setters on name and a bark method

(def Dog
	(lambda (name)
		(seq (def mySecret "hushhhh")
			(lambda (method &params)
				(cond
					((eq? method "getName") name)
					((eq? method "setName") (seq (def name (first params)) name))
					((eq? method "bark") (log "Woof!"))
					((eq? method "tellSecret") (log mySecret))))))) 

(class (Dog name)
	((fieldA "A") (fieldB "A") (fieldC "C"))
	(("getFieldA" fieldA)
	 ("setFieldA" (def name (first params)))
	;; Unfinised, trying to etch out a syntax and then write a 'class' macro
	
	
;; factorial demostrating both recursion and scope (facthelp not visible outside of myfact)
(def myfact
	(lambda (n)
		(seq
			(def facthelp 
				(lambda (n acc)
					(cond
						((< n 1) acc)
						(else (facthelp (- n 1) (* acc n))))))
			(facthelp n 1))))	
	