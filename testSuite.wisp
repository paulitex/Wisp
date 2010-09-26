;; Wisp Test Runner version - 0.1
;; Copywrite Paul Lambert 2010

(append-body (h1 "Wisp Test Runner - v 0.1"))

(def test (lambda (name actual expected)
	(let ((outline (lambda (result)
			(append-body (div (+ (span (+ (span result) ": " name))) (list (list "class" result)))))))
	(cond
		((eq? actual expected) (outline "passed"))
	(else (outline "failed"))))))

(append-body (h2 "Reader Tests"))
(test "spaces" (quote   (  
	 "a"   "b"  "c")) (list    "a" "b" "c")) ; spaces in arguments

(append-body (h2 "Basic Lisp Rules") (div "(Rules adapted from McCarthy's Micro-Manual for lisp)"))

(test "value (QUOTE e) = e" 
	(quote "e") "e")
(test "value (QUOTE 2) = 2" 
	'2 2)
(test "value (CAR (QUOTE (A B C))) = A" 
	(first (quote ("a" "b" "c"))) "a") ; quoting lists
(test "value (CDR (QUOTE (A B C))) = (B C)" 
	(rest '("a" "b" "c")) (list "b" "c"))
(test "value (CONS (QUOTE A) (QUOTE (B C))) = (A B C)" 
	(cons (quote "a") (quote ("b" "c"))) (list "a" "b" "c"))
(test "value (EQUAL (CAR (QUOTE (A B))) (QUOTE A)) = T"
	(eq? (first (quote ("a" "b"))) '"a") true)	
(each '(234 "I am an atom" false)
	(lambda (atom) 
		(test "value (ATOM e) = T"
			(atom? atom) true)))
(each '((0 "a") (3 "b") (6 "c"))
	(lambda (pair)
		(test   "value (COND(p[1] e[1]) ... (p[n] e[n])) = value e[i], where p[i] is the the first of the p's whose value is T."
			(cond  
				((eq? 3 (+ (first pair) 3)) "a")
				((eq? 6 (+ (first pair) 3))  "b")
				((eq? 9 (+ (first pair) 3)) "c"))
			(second pair))))

;; Global Namespace Functions Tests
(append-body (h2 "Global Namespace Functions"))

(test "two strings are equal" "string1" "string1")


;; Quoting, backquoting and splicing
(append-body (h2 "Quoting, Backquoting, and Splicing"))
(test "backquote splicing"
	(let ((v '(oh boy)))
		`(zap ~@v ~v)) '(zap oh boy (oh boy)))
		

(append-body (h2 "Standard Library Macros"))
(test "letseq"
	(letseq ((x 4) (y (+ x x)) (z (+ y y))) (+ x y z))
	28)
	
	
	