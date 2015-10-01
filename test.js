import test from 'ava';
import fn from './';

test('assign own enumerable propreties from source to target object', t => {
	t.same(fn({foo: 0}, {bar: 1}), {foo: 0, bar: 1});
	t.same(fn({foo: 0}, null, undefined), {foo: 0});
	t.same(fn({foo: 0}, null, undefined, {bar: 1}, null), {foo: 0, bar: 1});
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
