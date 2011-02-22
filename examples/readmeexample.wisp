;; Runnable example from README

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