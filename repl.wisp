(append-body "<textarea id=\"out\"></textarea><br/>")
(append-body "<input onchange=\"addToTexArea(wisp.interp(wisp.parse(wisp.read(this.value)), env));\"></input><br />")