#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
// header type definitions
enum type {CONS, ATOM, FUNC, LAMBDA};

typedef struct {
	enum type type; // basic object, not sure what's the point of this struct, if it has any usage
					// figured it out. used as a template / parent object;
} object;

typedef struct {
	enum type type;
	char* name;
} atom_object; // fundamental letters or digits

typedef struct {
	enum type type;
	object* car;
	object* cdr;
} cons_object; // the cons cell

typedef struct {
	enum type type;
	object* (*fn)(object*, object*);
} func_object; // holds reference to C functions

typedef struct {
	enum type type;
	object* args;
	object* expr;
} lambda_object; // holds references to lambdas / lisp functions


// parser / reader

object* next_token(FILE* in){
	char ch = getc(in);
	
	while (isspace(ch) || ch == '\n') ch = getc(in); // advance through whitespace

	if (ch == EOF) exit(0);
	if (ch == ')') return atom(")");
	if (ch == '(') return atom("(");
	
	char buffer[128];
	int index = 0;
	
	while (!isspace(ch) && ch != '\n' && ch != ')'){
		buffer[index] = ch;
		ch = getc(in);
		buffer++;
	}
	
	if (ch == ')') ungetc(ch, in);
	
	buffer[index] = "\0"; // close up string buffer
	return atom(buffer);
}

object* read_tail(FILE *in){
	object* token = next_token(in);
	
	if (strcmp(name(token), ")") == 0){
		return NULL; // end of list
	}
	else if (strcmp(name(token), "(") == 0){
		// new list, create cons cell
		object* head = read_tail(in);
		object* tail = read_tail(in);
		return cons(head, tail);
	}
	else {
		object* head = token;
		object* tail = read_tail(in);
		return cons(head, tail);
	}
}

object* read(FILE* in){
	object* token = next_token(in);
	
	if (strcmp(name(token), "(") == 0) return read_tail(in);
	else return token;
}






















