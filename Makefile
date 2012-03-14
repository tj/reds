
test:
	@./node_modules/.bin/mocha --reporter spec

benchmark:
	@node benchmarks

.PHONY: test benchmark