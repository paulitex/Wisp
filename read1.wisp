(def make-adder
	(lambda (num1 num2)
		(lambda (other)
			(+ num1 num2 other))))
		
((make-adder 120 30) 100)

(def printType
	(lambda (item)
		(cond
			((atom? item) "atom!")
			((empty? item) "empty!")
			((list? item) "nonEmptyList!"))))

(printType (list "sonia"))