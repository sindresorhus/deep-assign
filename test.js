import test from 'ava';
import fn from './';

const nativeSymbols = Object(Symbol.for('')) !== Symbol.for('');

test('assign own enumerable propreties from source to target object', t => {
	t.deepEqual(fn({foo: 0}, {bar: 1}), {foo: 0, bar: 1});
	t.deepEqual(fn({foo: 0}, null, undefined), {foo: 0});
	t.deepEqual(fn({foo: 0}, null, undefined, {bar: 1}, null), {foo: 0, bar: 1});
});

test('do not assign null values', t => {
	t.deepEqual(fn({}, {foo: null}), {});
});

test('throw TypeError on null targets', t => {
	t.throws(() => fn({foo: null}, {foo: {}}), TypeError);
});

test('assign proprety, if proprety is null in the prototype chain', t => {
	const Unicorn = () => {};
	Unicorn.prototype.rainbows = null;
	const unicorn = new Unicorn();
	t.is(fn(unicorn, {rainbows: 'many'}).rainbows, 'many');
});

test('do not assign undefined values', t => {
	t.deepEqual(fn({}, {foo: undefined}), {});
});

test('throw TypeError on undefined targets', t => {
	t.throws(() => fn({foo: undefined}, {foo: {}}), TypeError);
});

test('assign proprety, if proprety is undefined in the prototype chain', t => {
	const Unicorn = () => {};
	Unicorn.prototype.rainbows = undefined;
	const unicorn = new Unicorn();
	t.is(fn(unicorn, {rainbows: 'many'}).rainbows, 'many');
});

test('do not merge with a target proprety in the prototype chain', t => {
	const amountOfRainbows = {amount: 'many'};
	const Unicorn = () => {};
	Unicorn.prototype.rainbows = amountOfRainbows;
	const unicorn = fn(new Unicorn(), {rainbows: 'none'});
	t.is(unicorn.rainbows, 'none');
	t.is(unicorn.rainbows.amount, undefined);
	t.is(Unicorn.prototype.rainbows, amountOfRainbows);
});

test('support numbers as targets', t => {
	const target = fn({answer: 42}, {answer: {rainbows: 'many'}});
	t.is(target.answer / 7, 6);
	t.is(target.answer.constructor, Number);
	t.is(target.answer.rainbows, 'many');
});

test('support boolean as targets', t => {
	const target = fn({foo: true}, {foo: {rainbows: 'many'}});
	t.is(target.foo.toString(), 'true');
	t.is(target.foo.constructor, Boolean);
	t.is(target.foo.rainbows, 'many');
});

test('support strings as targets', t => {
	const target = fn({rainbows: 'many'}, {rainbows: {answer: 42}});
	t.is(String(target.rainbows), 'many');
	t.is(target.rainbows.constructor, String);
	t.is(target.rainbows.answer, 42);
});

test('support arrays as targets', t => {
	const target = {a: ['many']};
	const source = {a: []};
	source.a[2] = 'unicorns';
	fn(target, source, {a: {answer: 42}});
	t.is(target.a[0], 'many');
	t.is(target.a[1], undefined);
	t.is(target.a[2], 'unicorns');
	t.is(target.a.constructor, Array);
	t.is(target.a.answer, 42);
});

test('support functions', t => {
	const oracle42 = () => 42;
	const oracle666 = () => 666;
	oracle42.foo = true;
	oracle42.bar = true;
	oracle666.bar = false;
	const target = fn({}, {oracle: oracle42}, {oracle: oracle666});
	t.is(target.oracle(), 42);
	t.is(target.oracle.foo, true);
	t.is(target.oracle.bar, false);
});

test('support multiple sources', t => {
	t.deepEqual(fn({foo: 0}, {bar: 1}, {bar: 2}), {foo: 0, bar: 2});
	t.deepEqual(fn({}, {}, {foo: 1}), {foo: 1});
});

test('only iterate own keys', t => {
	const Unicorn = () => {};
	Unicorn.prototype.rainbows = 'many';
	const unicorn = new Unicorn();
	unicorn.bar = 1;
	t.deepEqual(fn({foo: 1}, unicorn), {foo: 1, bar: 1});
});

test('return the modified target object', t => {
	const target = {};
	const returned = fn(target, {a: 1});
	t.is(returned, target);
});

test('support `Object.create(null)` objects', t => {
	const obj = Object.create(null);
	obj.foo = true;
	t.deepEqual(fn({}, obj), {foo: true});
});

test('support `Object.create(null)` targets', t => {
	const target = Object.create(null);
	const expected = Object.create(null);
	target.foo = true;
	expected.foo = true;
	expected.bar = false;
	t.deepEqual(fn(target, {bar: false}), expected);
});

test('preserve property order', t => {
	const letters = 'abcdefghijklmnopqrst';
	const source = {};
	letters.split('').forEach(letter => {
		source[letter] = letter;
	});
	const target = fn({}, source);
	t.is(Object.keys(target).join(''), letters);
});

test('deep', t => {
	t.deepEqual(fn({
		foo: {
			foo: {
				foo: true
			},
			bar: {
				bar: false
			}
		}
	}, {
		foo: {
			foo: {
				foo: false,
				bar: true
			}
		},
		bar: true
	}), {
		foo: {
			foo: {
				foo: false,
				bar: true
			},
			bar: {
				bar: false
			}
		},
		bar: true
	});
});

test('support symbols as targets', t => {
	const target = fn({sym: Symbol.for('foo')}, {sym: {rainbows: 'many'}});
	t.true(target.sym instanceof Symbol);
	t.is(target.sym.rainbows, 'many');
});

(nativeSymbols ? test : test.skip)('support symbol properties', t => {
	const target = {};
	const source = {};
	const sym = Symbol('foo');
	source[sym] = 'bar';
	fn(target, source);
	t.is(target[sym], 'bar');
});

(nativeSymbols ? test : test.skip)('only copy enumerable symbols', t => {
	const target = {};
	const source = {};
	const sym = Symbol('foo');
	Object.defineProperty(source, sym, {
		enumerable: false,
		value: 'bar'
	});
	fn(target, source);
	t.false(sym in target);
});

test('do not transform functions', t => {
	const target = {foo: function bar() {}};
	const source = {};
	t.is(typeof fn({}, target, source).foo, 'function');
});

test('bug - reuses object in deep assignment', t => {
	const fixture = {
		foo: {
			bar: false
		}
	};

	const run = x => {
		const opts = fn({}, fixture);

		if (x === true) {
			opts.foo.bar = true;
		}

		return opts.foo.bar;
	};

	t.true(run(true));
	t.false(run());
});
