
(def else true)
(def empty (list))
;;  I'm not sure if I want to have aliases or not. My gut instinct is no.
;; Wisp should be a) minimalist and b) opinionated. We can make a library/namespace
;; for backwards compatibility but by default I want to avoid aliases and ambiguity
;; (like cdr/rest car/fitst empty?/null, etc...). else and empty are special as they are
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



