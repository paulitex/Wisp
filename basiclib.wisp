
(def else true)
(def empty (list))
;;  I'm not sure if I want to have aliases or not. My gut instinct is no.
;; Wisp should be a) minimalist and b) opinionated. We can make a library/namespace
;; for backwards compatibility but by default I want to avoid aliases and ambiguity
;; (like cdr/rest car/first empty?/null, etc...). else and empty are special as they are
;; more like language constructs than aliases.
; (def cons? list?)
; (def car first)
; (def cdr rest)
; (def null? empty?)
; (def = eq?)

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
			
;(defmacro deftags (tags body)
;	(map (lambda (tag) 
;		`(def ~tag 
;			(lambda (body)
;				(+ "<" tag ">" body "</" tag ">")))) tags))


;; Html	
;(let ((tags (split " " "h1 h2 h3 h4 h5 h6 p span div li ol ul title")))
;	(each tags 
;		(lambda (tag)
;			(def tag 
;				(lambda (body)
;					(+ "<" tag ">" body "</" tag ">"))))))


;; crappy none macro work. need to fix this, just a couple for now


(def htmlAttributeString 
	(lambda (ls)
		(cond 
			((empty? ls) "")
			(else (+ (first (first ls)) "=\"" (second (first ls)) "\" " (htmlAttributeString (rest ls)))))))

			
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
	(lambda ()
		(let ((body (first _argslist)) (attributes (rest _argslist)))
			(+ "<span"
				(cond 
					((empty? attributes) ">")
					(else (+ " " (htmlAttributeString (first attributes)) ">")))
				body "</span>"))))

		
(def div 
	(lambda ()
		(let ((body (first _argslist)) (attributes (rest _argslist)))
			(+ "<div"
				(cond 
					((empty? attributes) ">")
					(else (+ " " (htmlAttributeString (first attributes)) ">")))
				body "</div>"))))








