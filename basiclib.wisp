(def = eq?)
(def else true)
(def empty (list))
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
		
(def if
	(lambda ()
		(cond
			((first argslist) (second argslist))
			(else (third argslist)))))

(def _reverse_acc 
	(lambda (ls acc)
		(cond 
			((empty? ls ) acc)
			(else (_reverse_acc (rest ls) (cons (first ls) acc))))))

(def reverse
	(lambda (ls) (_reverse_acc ls empty)))



