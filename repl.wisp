(append-body (h1 "Wisp: Read Eval Print Loop - v 0.2"))
(append-body "<textarea id=\"out\"></textarea><br/>")
(append-body "<input onchange=\"addToTextArea('wisp>' + this.value); addToTextArea('=> ' + wisp.interp(wisp.parse(wisp.read(this.value)), env)); this.value = ''\"></input><br />")