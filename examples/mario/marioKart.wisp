(def races
	(list	(list "Mushroom" (split " " "lu moo gorge toad"))
			(list "Flower" (split " " "mario mall dk wario"))
			(list "Star" (split " " "daisy koopa maple grumble"))
			(list "Special" (split " " "dry moon bowser rainbow"))
			(list "Shell" (split " " "peach yoshi ghost n64"))
			(list "Banada" (split " " "sherbet shy delfino waluigi"))
			(list "Leaf" (split " " "desert bowser jungle mario"))
			(list "Lightining" (split " " "mario peach mountain castle"))))
		
(let ((cup (pickn (random 8) races)))
	(let ((race (pickn (random 4) (second cup))))
		(append-body (h2 (+ "The Circuit is " (first cup) " and the race is " race)))))
