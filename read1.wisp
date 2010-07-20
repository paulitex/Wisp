(def numwhat 5)

(def addwhat
	(lambda ()
		numwhat))
		
(def numwhat 10)
		
(addwhat)

(def length (lambda (ls)
		(cond
			((empty? ls) 0)
			(else (+ 1 (length (rest ls)))))))
			
(def islength
	(lambda (ls)
		(length ls)))

(def length (lambda (ls)
1000))

(islength (list 1 2 8 8))


