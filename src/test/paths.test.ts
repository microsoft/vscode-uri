/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'mocha';
import * as assert from 'assert';
import { joinPath, resolvePath, extname, basename, URI } from '../index';
import { posix } from 'path';

suite('URI path operations', () => {
	test('join', async function () {
		function assertJoin(uri: string, paths: string[], expected: string, verifyAgainstNodeJS = true) {
            const testUri = URI.parse(uri);
			assert.strictEqual(joinPath(testUri, ...paths).toString(), expected, uri);
			if (verifyAgainstNodeJS) {
				assert.strictEqual(posix.join(testUri.path || '/', ...paths), URI.parse(expected).path, testUri.path + ' (nodejs)');
			}
		}
		assertJoin('foo://a/foo/bar', ['x'], 'foo://a/foo/bar/x');
		assertJoin('foo://a/foo/bar/', ['x'], 'foo://a/foo/bar/x');
		assertJoin('foo://a/foo/bar/', ['/x'], 'foo://a/foo/bar/x');
		assertJoin('foo://a/foo/bar/', ['x/'], 'foo://a/foo/bar/x/');
		assertJoin('foo://a/foo/bar/', ['x', 'y'], 'foo://a/foo/bar/x/y');
		assertJoin('foo://a/foo/bar/', ['x/', '/y'], 'foo://a/foo/bar/x/y');
		assertJoin('foo://a/foo/bar/', ['.', '/y'], 'foo://a/foo/bar/y');
		assertJoin('foo://a/foo/bar/', ['x/y/z', '..'], 'foo://a/foo/bar/x/y');
	});

	test('resolve', async function () {
		function assertResolve(uri: string, path: string, expected: string, verifyAgainstNodeJS = true) {
            const testUri = URI.parse(uri);
			assert.strictEqual(resolvePath(testUri, path).toString(), expected, uri);
			if (verifyAgainstNodeJS) {
				assert.strictEqual(posix.resolve(testUri.path || '/', path), URI.parse(expected).path, testUri.path + ' (nodejs)');
			}
		}
		assertResolve('foo://a/foo/bar', 'x', 'foo://a/foo/bar/x');
		assertResolve('foo://a/foo/bar/', 'x', 'foo://a/foo/bar/x');
		assertResolve('foo://a/foo/bar/', '/x', 'foo://a/x');
		assertResolve('foo://a/foo/bar/', 'x/', 'foo://a/foo/bar/x/', false /*NodeJS removes trailing sep*/);
		
		assertResolve('foo://a', 'x/', 'foo://a/x/', false /*NodeJS removes trailing sep*/);
		assertResolve('foo://a', '/x/', 'foo://a/x/', false /*NodeJS removes trailing sep*/);

		assertResolve('foo://a/b', '/x/..//y/.', 'foo://a/y');
		assertResolve('foo://a/b', 'x/..//y/.', 'foo://a/b/y');
	});

	test('normalize', async function () {
		function assertNormalize(path: string, expected: string, verifyAgainstNodeJS = true) {
            let testUri = URI.from({scheme: 'foo', path, authority: path.startsWith('/') ? 'bar' : undefined});
            const actual = joinPath(testUri).path;
			assert.strictEqual(actual, expected, path);
			if (verifyAgainstNodeJS) {
				assert.strictEqual(posix.normalize(path), expected, path + ' (nodejs)');
			}	
		}
		assertNormalize('a', 'a');
		assertNormalize('/a', '/a');
		assertNormalize('a/', 'a/');
		assertNormalize('a/b', 'a/b');
		assertNormalize('/a/foo/bar/x', '/a/foo/bar/x');
		assertNormalize('/a/foo/bar//x', '/a/foo/bar/x');
		assertNormalize('/a/foo/bar///x', '/a/foo/bar/x');
		assertNormalize('/a/foo/bar/x/', '/a/foo/bar/x/');
		assertNormalize('a/foo/bar/x/', 'a/foo/bar/x/');
		assertNormalize('a/foo/bar/x//', 'a/foo/bar/x/');
		assertNormalize('//a/foo/bar/x//', '/a/foo/bar/x/');
		assertNormalize('a/.', 'a');
		assertNormalize('a/..', '', false /*NodeJS uses .*/);
		assertNormalize('a/./b', 'a/b');
		assertNormalize('a/././b', 'a/b');
		assertNormalize('a/n/../b', 'a/b');
		assertNormalize('a/n/../', 'a/');
		assertNormalize('a/n/../', 'a/');
		assertNormalize('/a/n/../..', '/');
		assertNormalize('/a/n/../../..', '/');
		assertNormalize('..', '', false /*NodeJS keeps ..*/);
		assertNormalize('/..', '/');
	});

	test('extname', async function () {
		function assertExtName(input: string, expected: string) {
            const testUri = URI.parse(input);
			assert.strictEqual(extname(testUri), expected, input);
			assert.strictEqual(posix.extname(input), expected, input + ' (nodejs)');
		}
		assertExtName('foo://a/foo/bar', '');
		assertExtName('foo://a/foo/bar.foo', '.foo');
		assertExtName('foo://a/foo/.foo', '');

		assertExtName('foo://a/foo/a.foo/', '.foo');
		assertExtName('foo://a/foo/a.foo//', '.foo');
	});

	test('basename', () => {
		function assertBasename(input: string, expected: string) {
            const testUri = URI.parse(input);
			assert.strictEqual(basename(testUri), expected, input);
			assert.strictEqual(posix.basename(testUri.path), expected, input + ' (nodejs)');
		}

		assertBasename('foo://a/some/file/test.txt', 'test.txt');
		assertBasename('foo://a/some/file/', 'file');
		assertBasename('foo://a/some/file///', 'file');
		assertBasename('foo://a/some/file', 'file');
		assertBasename('foo://a/some', 'some');
		assertBasename('foo://a/', '');
		assertBasename('foo://a', '');
	});
	
});
