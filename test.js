import test from 'ava';
import fn from './';

test('assign own enumerable propreties from source to target object', t => {
	t.same(fn({foo: 0}, {bar: 1}), {foo: 0, bar: 1});
	t.same(fn({foo: 0}, null, undefined), {foo: 0});
	t.same(fn({foo: 0}, null, undefined, {bar: 1}, null), {foo: 0, bar: 1});
	t.end();
});

test('do not assign null values', t => {
	t.same(fn({}, {foo: null}), {});
	t.end();
});

test('throw TypeError on null targets', t => {
	t.throws(() => fn({foo: null}, {foo: {}}), TypeError);
	t.end();
});

test('assign proprety, if proprety is null in the prototype chain', t => {
	var Unicorn = () => {};
	Unicorn.prototype.rainbows = null;
	var unicorn = new Unicorn();
	t.is(fn(unicorn, {rainbows: 'many'}).rainbows, 'many');
	t.end();
});

test('do not assign undefined values', t => {
	t.same(fn({}, {foo: undefined}), {});
	t.end();
});

test('throw TypeError on undefined targets', t => {
	t.throws(() => fn({foo: undefined}, {foo: {}}), TypeError);
	t.end();
});

test('assign proprety, if proprety is undefined in the prototype chain', t => {
	var Unicorn = () => {};
	Unicorn.prototype.rainbows = undefined;
	var unicorn = new Unicorn();
	t.is(fn(unicorn, {rainbows: 'many'}).rainbows, 'many');
	t.end();
});

test('do not merge with a target proprety in the prototype chain', t => {
	var amountOfRainbows = {amount: 'many'};
	var Unicorn = () => {};
	Unicorn.prototype.rainbows = amountOfRainbows;
	var unicorn = fn(new Unicorn(), {rainbows: 'none'});
	t.is(unicorn.rainbows, 'none');
	t.is(unicorn.rainbows.amount, undefined);
	t.is(Unicorn.prototype.rainbows, amountOfRainbows);
	t.end();
});

test('support numbers as targets', t => {
	var target = fn({answer: 42}, {answer: {rainbows: 'many'}});
	t.is(target.answer / 7, 6);
	t.is(target.answer.constructor, Number);
	t.is(target.answer.rainbows, 'many');
	t.end();
});

test('support boolean as targets', t => {
	var target = fn({foo: true}, {foo: {rainbows: 'many'}});
	t.is(target.foo.toString(), 'true');
	t.is(target.foo.constructor, Boolean);
	t.is(target.foo.rainbows, 'many');
	t.end();
});

test('support strings as targets', t => {
	var target = fn({rainbows: 'many'}, {rainbows: {answer: 42}});
	t.is('' + target.rainbows, 'many');
	t.is(target.rainbows.constructor, String);
	t.is(target.rainbows.answer, 42);
	t.end();
});

test('support Date as targets', t => {
	var target = fn({date: new Date()}, {date: 1446275964787});
	t.is(target.date, 1446275964787);
	t.is(target.date.constructor, Number);
	t.end();
});

test('support Date as targets', t => {
	var target = fn({date: new Date()}, {date: new Date(1446275964787)});
	t.is(target.date.getTime(), 1446275964787);
	t.is(target.date.constructor, Date);
	t.end();
});

test('support RegExp as targets', t => {
	var target = fn({regexp: /reg/}, {regexp: 'string'});
	t.is(target.regexp.constructor, String);
	t.is(target.regexp, 'string');
	t.end();
});

test('support RegExp as targets', t => {
	var target = fn({regexp: /reg/}, {regexp: /new/});
	t.is(target.regexp.constructor, RegExp);
	t.is(target.regexp.test('new'), true);
	t.end();
});

test('support arrays as targets', t => {
	var target = {a: ['many']};
	var source = {a: []};
	source.a[2] = 'unicorns';
	fn(target, source, {a: {answer: 42}});
	t.is(target.a[0], 'many');
	t.is(target.a[1], undefined);
	t.is(target.a[2], 'unicorns');
	t.is(target.a.constructor, Array);
	t.is(target.a.answer, 42);
	t.end();
});

test('support functions', t => {
	var oracle42 = () => 42;
	var oracle666 = () => 666;
	oracle42.foo = true;
	oracle42.bar = true;
	oracle666.bar = false;
	var target = fn({}, {oracle: oracle42}, {oracle: oracle666});
	t.is(target.oracle(), 42);
	t.is(target.oracle.foo, true);
	t.is(target.oracle.bar, false);
	t.end();
});

test('support multiple sources', t => {
	t.same(fn({foo: 0}, {bar: 1}, {bar: 2}), {foo: 0, bar: 2});
	t.same(fn({}, {}, {foo: 1}), {foo: 1});
	t.end();
});

test('only iterate own keys', t => {
	var Unicorn = () => {};
	Unicorn.prototype.rainbows = 'many';
	var unicorn = new Unicorn();
	unicorn.bar = 1;
	t.same(fn({foo: 1}, unicorn), {foo: 1, bar: 1});
	t.end();
});

test('return the modified target object', t => {
	var target = {};
	var returned = fn(target, {a: 1});
	t.is(returned, target);
	t.end();
});

test('support `Object.create(null)` objects', t => {
	var obj = Object.create(null);
	obj.foo = true;
	t.same(fn({}, obj), {foo: true});
	t.end();
});

test('support `Object.create(null)` targets', t => {
	var obj = Object.create(null);
	obj.foo = true;
	t.same(fn(obj, {bar: false}), {foo: true, bar: false});
	t.end();
});

test('preserve property order', t => {
	var letters = 'abcdefghijklmnopqrst';
	var source = {};
	letters.split('').forEach(function (letter) {
		source[letter] = letter;
	});
	var target = fn({}, source);
	t.is(Object.keys(target).join(''), letters);
	t.end();
});

test('deep', t => {
	t.same(fn({
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

	t.end();
});

if (typeof Symbol !== 'undefined') {
	test('support symbol properties', t => {
		var target = {};
		var source = {};
		var sym = Symbol('foo');
		source[sym] = 'bar';
		fn(target, source);
		t.is(target[sym], 'bar');
		t.end();
	});

	test('support symbols as targets', t => {
		var target = fn({sym: Symbol('foo')}, {sym: {rainbows: 'many'}});
		t.is(target.sym.constructor, Symbol);
		t.is(target.sym.rainbows, 'many');
		t.end();
	});

	test('only copy enumerable symbols', t => {
		var target = {};
		var source = {};
		var sym = Symbol('foo');
		Object.defineProperty(source, sym, {
			enumerable: false,
			value: 'bar'
		});
		fn(target, source);
		t.is(target[sym], undefined);
		t.end();
	});
}

test('do not transform functions', t => {
	var target = {
		foo: function bar() {}
	};
	var source = {};
	t.is(typeof fn({}, target, source).foo, 'function');
	t.end();
});
