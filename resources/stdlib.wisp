
(def else true)
(def empty (list))
;;  I'm not sure if I want to have aliases or not. My gut instinct is no.
;; Wisp should be a) minimalist and b) opinionated. We can make a library/namespace
;; for backwards compatibility but by default I want to avoid aliases and ambiguity
;; (like cdr/rest car/first empty?/null, etc...). else and empty are special as they are
;; more like language constructs than aliases.
 (def cons? list?)
 (def car first)
 (def cdr rest)
 (def null? empty?)

(def length (lambda (ls)
		(cond
			((empty? ls) 0)
			(else (+ 1 (length (rest ls)))))))

(def second
	(lambda (ls)
		(first (rest ls))))

(def third
	(lambda (ls)
		(first (rest (rest ls)))))

(def fourth
	(lambda (ls)
		(first (rest (rest (rest ls))))))
		
(def firsts
	(lambda (ls)
		(cond
			((empty? ls) ls)
			(else (cons (first (first ls)) (firsts (rest ls)))))))
		
(def seconds
	(lambda (ls)
		(cond
			((empty? ls) ls)
			(else (cons (second (first ls)) (seconds (rest ls)))))))

;; should be a macro not a function.
; (def if
; 	(lambda ()
; 		(cond
; 			((first argslist) (second argslist))
; 			(else (third argslist)))))

(def _reverse_acc 
	(lambda (ls acc)
		(cond 
			((empty? ls ) acc)
			(else (_reverse_acc (rest ls) (cons (first ls) acc))))))

(def reverse
	(lambda (ls) (_reverse_acc ls empty)))


(def map 
	(lambda (fn ls)
		(cond
			((empty? ls) empty)
			(else  (cons (fn (first ls)) (map fn (rest ls)))))))
			
(def each 
	(lambda (ls fn) (map fn ls)))
	
(def pickn 
	(lambda (n ls)
		(cond
			((eq? 0 n) (first ls))
			(else (pickn (- n 1) (rest ls))))))
	
;; cons on to the end of a list 		
(def consend
	(lambda (item ls)
		(cond
			((empty? ls) (cons item ls))
			(else (cons (first ls) (consend item (rest ls)))))))

;; macros
(def let 
	(macro (bindings body)
			`((lambda ~(firsts bindings) ~body ) ~@(seconds bindings))))

(def letseq
	(macro (bindings body)
		(cond
			((empty? bindings) body)
			(else (consend `(letseq ~(rest bindings) ~body)
						`(let (~(first bindings))))))))
						
(def defun 
	(macro (name params body)
		`(def ~name 
			(lambda ~params ~body))))
			
(def defmacro 
	(macro (name params body)
		`(def ~name 
			(macro ~params ~body))))

(defmacro <- (name body) 
	`(def ~name ~body))
	
(defmacro if (decision yesExpr elseExpr)
	`(cond 
		(~decision ~yesExpr)
		(else ~elseExpr)))

;; Html	
;(let ((tags (split " " "h1 h2 h3 h4 h5 h6 p span div li ol ul title"))

(def htmlAttributeString 
	(lambda (ls)
		(cond 
			((empty? ls) "")
			(else (+ (first (first ls)) "=\"" (second (first ls)) "\" " (htmlAttributeString (rest ls)))))))


(defmacro defPairedHtml (tagNames)
	(if (empty? tagNames)
		`empty
		`(seq
			(def ~(first tagNames)
				(lambda (attrList body) 
					(let ((tag ~(+ "\"" (first tagNames) "\"")))
						(+ "<" tag " " (htmlAttributeString attrList) ">" body "</" tag ">"))
						))
				(defPairedHtml ~(rest tagNames)))))
			
;; FIX THIS
(def h1 
	(lambda (body)
		(+ "<h1>" body "</h1>")))
					
(def h2 
	(lambda (body)
		(+ "<h2>" body "</h2>")))
		
(def h3 
	(lambda (body)
		(+ "<h3>" body "</h3>")))
		
(def p 
	(lambda (body)
		(+ "<p>" body "</p>")))

(def span 
	(lambda (&args)
		(let ((body (first args)) (attributes (rest args)))
			(+ "<span"
				(cond 
					((empty? attributes) ">")
					(else (+ " " (htmlAttributeString (first attributes)) ">")))
				body "</span>"))))

		
(def div 
	(lambda (&args)
		(let ((body (first args)) (attributes (rest args)))
			(+ "<div"
				(cond 
					((empty? attributes) ">")
					(else (+ " " (htmlAttributeString (first attributes)) ">")))
				body "</div>"))))








