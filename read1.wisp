(def length (lambda (ls)
		(cond
			((empty? ls) 0)
			(else (+ 1 (length (rest ls))))
			)))

(def mylist
	(list "hey" "there" "I'm" "a" "cat"))
	
(length mylist)

(first mylist)

(def second
	(lambda (ls)
		(first (rest ls))))
		
(second mylist)

(def third
	(lambda (ls)
		(first (rest (rest ls)))))
		
(third mylist)

(def if
	(lambda ()
		(cond
			((first argslist) (second argslist))
			(else (third argslist)))))
			
(if (eq? 3 (list 3)) (+ 100 200) (- 300 400))

(length mylist)
