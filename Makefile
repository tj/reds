
test:
	@node test

bench:
	@./node_modules/.bin/matcha benchmarks

.PHONY: test bench