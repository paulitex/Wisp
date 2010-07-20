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
		
(def if
	(lambda ()
		(cond
			((first argslist) (second argslist))
			(else (third argslist)))))