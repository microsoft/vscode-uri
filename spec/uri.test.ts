/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import Uri from '../lib/index';
import * as path from 'path';

suite('URI', () => {

    function normalize(path: string) {
        if (process.platform === 'win32') {
            return path.replace(/\//g, '\\');
        } else {
            return path;
        }
    }

	test('file#toString', () => {
		assert.equal(Uri.file('c:/win/path').toString(), 'file:///c%3A/win/path');
		assert.equal(Uri.file('C:/win/path').toString(), 'file:///c%3A/win/path');
		assert.equal(Uri.file('c:/win/path/').toString(), 'file:///c%3A/win/path/');
		assert.equal(Uri.file('/c:/win/path').toString(), 'file:///c%3A/win/path');
		assert.equal(Uri.file('c:\\win\\path').toString(), 'file:///c%3A/win/path');
		assert.equal(Uri.file('c:\\win/path').toString(), 'file:///c%3A/win/path');
	});

	test('file#path', () => {
		assert.equal(Uri.file('c:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
		assert.equal(Uri.file('c:/win/path/').fsPath.replace(/\\/g, '/'), 'c:/win/path/');
		assert.equal(Uri.file('C:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
		assert.equal(Uri.file('/c:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
		assert.equal(Uri.file('./c/win/path').fsPath.replace(/\\/g, '/'), '/./c/win/path');
		assert.equal(Uri.file('c:\\win\\path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
		assert.equal(Uri.file('c:\\win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
	});

	test('http#toString', () => {
		assert.equal(Uri.from({ scheme: 'http', authority: 'www.msft.com', path: '/my/path' }).toString(), 'http://www.msft.com/my/path');
		assert.equal(Uri.from({ scheme: 'http', authority: 'www.msft.com', path: '/my/path' }).toString(), 'http://www.msft.com/my/path');
		assert.equal(Uri.from({ scheme: 'http', authority: 'www.MSFT.com', path: '/my/path' }).toString(), 'http://www.msft.com/my/path');
		assert.equal(Uri.from({ scheme: 'http', path: 'my/path' }).toString(), 'http:my/path');
		assert.equal(Uri.from({ scheme: 'http', path: '/my/path' }).toString(), 'http:/my/path');
		assert.equal(Uri.from({ scheme: '', path: 'my/path' }).toString(), 'my/path');
		assert.equal(Uri.from({ scheme: '', path: '/my/path' }).toString(), '/my/path');
		//http://a-test-site.com/#test=true
		assert.equal(Uri.from({ scheme: 'http', authority: 'a-test-site.com', path: '/', query: 'test=true' }).toString(), 'http://a-test-site.com/?test%3Dtrue');
		assert.equal(Uri.from({ scheme: 'http', authority: 'a-test-site.com', path: '/', fragment: 'test=true' }).toString(), 'http://a-test-site.com/#test%3Dtrue');
	});

	test('http#toString, encode=FALSE', () => {
		assert.equal(Uri.from({ scheme: 'http', authority: 'a-test-site.com', path: '/', query: 'test=true' }).toString(true), 'http://a-test-site.com/?test=true');
		assert.equal(Uri.from({ scheme: 'http', authority: 'a-test-site.com', path: '/', fragment: 'test=true' }).toString(true), 'http://a-test-site.com/#test=true');
		assert.equal(Uri.from({ scheme: 'http', path: '/api/files/test.me', query: 't=1234' }).toString(true), 'http:/api/files/test.me?t=1234');

		var value = Uri.parse('file://shares/pröjects/c%23/#l12');
		assert.equal(value.authority, 'shares');
		assert.equal(value.path, '/pröjects/c#/');
		assert.equal(value.fragment, 'l12');
		assert.equal(value.toString(), 'file://shares/pr%C3%B6jects/c%23/#l12');
		assert.equal(value.toString(true), 'file://shares/pröjects/c%23/#l12');

		var uri2 = Uri.parse(value.toString(true));
		var uri3 = Uri.parse(value.toString());
		assert.equal(uri2.authority, uri3.authority);
		assert.equal(uri2.path, uri3.path);
		assert.equal(uri2.query, uri3.query);
		assert.equal(uri2.fragment, uri3.fragment);
	});

	test('with, identity', () => {
		let uri = Uri.parse('foo:bar/path');

		let uri2 = uri.with(null);
		assert.ok(uri === uri2);
		uri2 = uri.with(undefined);
		assert.ok(uri === uri2);
		uri2 = uri.with({});
		assert.ok(uri === uri2);
		uri2 = uri.with({ scheme: 'foo', path: 'bar/path' });
		assert.ok(uri === uri2);
	});

	test('with, changes', () => {
		assert.equal(Uri.parse('before:some/file/path').with({ scheme: 'after' }).toString(), 'after:some/file/path');
		assert.equal(Uri.from({ scheme: 'http', path: '/api/files/test.me', query: 't=1234' }).toString(), 'http:/api/files/test.me?t%3D1234');
		assert.equal(Uri.from({ scheme: 'http', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'http:/api/files/test.me?t%3D1234');
		assert.equal(Uri.from({ scheme: 'https', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'https:/api/files/test.me?t%3D1234');
		assert.equal(Uri.from({ scheme: 'HTTP', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'HTTP:/api/files/test.me?t%3D1234');
		assert.equal(Uri.from({ scheme: 'HTTPS', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'HTTPS:/api/files/test.me?t%3D1234');
		assert.equal(Uri.from({ scheme: 'boo', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'boo:/api/files/test.me?t%3D1234');
	});

	test('parse', () => {
		var value = Uri.parse('http:/api/files/test.me?t=1234');
		assert.equal(value.scheme, 'http');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/api/files/test.me');
		assert.equal(value.query, 't=1234');
		assert.equal(value.fragment, '');

		value = Uri.parse('http://api/files/test.me?t=1234');
		assert.equal(value.scheme, 'http');
		assert.equal(value.authority, 'api');
		assert.equal(value.path, '/files/test.me');
		assert.equal(value.fsPath, normalize('/files/test.me'));
		assert.equal(value.query, 't=1234');
		assert.equal(value.fragment, '');

		value = Uri.parse('file:///c:/test/me');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/c:/test/me');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');
		assert.equal(value.fsPath, normalize('c:/test/me'));

		value = Uri.parse('file://shares/files/c%23/p.cs');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, 'shares');
		assert.equal(value.path, '/files/c#/p.cs');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');
		assert.equal(value.fsPath, normalize('//shares/files/c#/p.cs'));

		value = Uri.parse('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins/c%23/plugin.json');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins/c#/plugin.json');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');

		value = Uri.parse('file:///c:/test %25/path');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/c:/test %/path');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');

		value = Uri.parse('inmemory:');
		assert.equal(value.scheme, 'inmemory');
		assert.equal(value.authority, '');
		assert.equal(value.path, '');
		assert.equal(value.query, '');
		assert.equal(value.fragment, '');

		value = Uri.parse('api/files/test');
		assert.equal(value.scheme, '');
		assert.equal(value.authority, '');
		assert.equal(value.path, 'api/files/test');
		assert.equal(value.query, '');
		assert.equal(value.fragment, '');

		value = Uri.parse('api');
		assert.equal(value.scheme, '');
		assert.equal(value.authority, '');
		assert.equal(value.path, 'api');
		assert.equal(value.query, '');
		assert.equal(value.fragment, '');

		value = Uri.parse('/api/files/test');
		assert.equal(value.scheme, '');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/api/files/test');
		assert.equal(value.query, '');
		assert.equal(value.fragment, '');

		value = Uri.parse('?test');
		assert.equal(value.scheme, '');
		assert.equal(value.authority, '');
		assert.equal(value.path, '');
		assert.equal(value.query, 'test');
		assert.equal(value.fragment, '');

		value = Uri.parse('file:?q');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '');
		assert.equal(value.query, 'q');
		assert.equal(value.fragment, '');

		value = Uri.parse('#test');
		assert.equal(value.scheme, '');
		assert.equal(value.authority, '');
		assert.equal(value.path, '');
		assert.equal(value.query, '');
		assert.equal(value.fragment, 'test');

		value = Uri.parse('file:#d');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '');
		assert.equal(value.query, '');
		assert.equal(value.fragment, 'd');
	});

	test('parse, disallow //path when no authority', () => {
		assert.throws(() => Uri.parse('file:////shares/files/p.cs'));
	});

	test('URI#file', () => {

		var value = Uri.file('\\\\shäres\\path\\c#\\plugin.json');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, 'shäres');
		assert.equal(value.path, '/path/c#/plugin.json');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');
		assert.equal(value.toString(), 'file://sh%C3%A4res/path/c%23/plugin.json');

		// identity toString -> parse -> toString
		value = Uri.parse(value.toString());
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, 'shäres');
		assert.equal(value.path, '/path/c#/plugin.json');
		assert.equal(value.fragment, '');
		assert.equal(value.query, '');
		assert.equal(value.toString(), 'file://sh%C3%A4res/path/c%23/plugin.json');

		value = Uri.file('\\\\localhost\\c$\\GitDevelopment\\express');
		assert.equal(value.scheme, 'file');
		assert.equal(value.path, '/c$/GitDevelopment/express');
		assert.equal(value.fsPath, normalize('//localhost/c$/GitDevelopment/express'));
		assert.equal(value.query, '');
		assert.equal(value.fragment, '');
		assert.equal(value.toString(), 'file://localhost/c%24/GitDevelopment/express');

		value = Uri.file('c:\\test with %\\path');
		assert.equal(value.path, '/c:/test with %/path');
		assert.equal(value.toString(), 'file:///c%3A/test%20with%20%25/path');

		value = Uri.file('c:\\test with %25\\path');
		assert.equal(value.path, '/c:/test with %25/path');
		assert.equal(value.toString(), 'file:///c%3A/test%20with%20%2525/path');

		value = Uri.file('c:\\test with %25\\c#code');
		assert.equal(value.path, '/c:/test with %25/c#code');
		assert.equal(value.toString(), 'file:///c%3A/test%20with%20%2525/c%23code');

		value = Uri.file('\\\\shares');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, 'shares');
		assert.equal(value.path, '/'); // slash is always there

		value = Uri.file('\\\\shares\\');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, 'shares');
		assert.equal(value.path, '/');

		// we don't complain here
		value = Uri.file('file://path/to/file');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/file://path/to/file');
	});

	test('URI#file, auto-slash windows drive letter', () => {

		var value = Uri.file('c:\\test\\drive');
		assert.equal(value.path, '/c:/test/drive');
		assert.equal(value.toString(), 'file:///c%3A/test/drive');
	});

	test('URI#file, always slash', () => {

		var value = Uri.file('a.file');
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/a.file');
		assert.equal(value.toString(), 'file:///a.file');

		value = Uri.parse(value.toString());
		assert.equal(value.scheme, 'file');
		assert.equal(value.authority, '');
		assert.equal(value.path, '/a.file');
		assert.equal(value.toString(), 'file:///a.file');
	});

	test('URI.toString, only scheme and query', () => {
		var value = Uri.parse('stuff:?qüery');
		assert.equal(value.toString(), 'stuff:?q%C3%BCery');
	});

	test('URI#toString, upper-case percent espaces', () => {
		var value = Uri.parse('file://sh%c3%a4res/path');
		assert.equal(value.toString(), 'file://sh%C3%A4res/path');
	});

	test('URI#toString, escape all the bits', () => {

		var value = Uri.file('/Users/jrieken/Code/_samples/18500/Mödel + Other Thîngß/model.js');
		assert.equal(value.toString(), 'file:///Users/jrieken/Code/_samples/18500/M%C3%B6del%20%2B%20Other%20Th%C3%AEng%C3%9F/model.js');
	});

	test('URI#toString, don\'t encode port', () => {
		var value = Uri.parse('http://localhost:8080/far');
		assert.equal(value.toString(), 'http://localhost:8080/far');

		value = Uri.from({ scheme: 'http', authority: 'löcalhost:8080', path: '/far', });
		assert.equal(value.toString(), 'http://l%C3%B6calhost:8080/far');
	});

	// test('correctFileUriToFilePath2', () => {

	// 	var test = (input: string, expected: string) => {
	// 		expected = normalize(expected);
	// 		var value = Uri.parse(input);
	// 		assert.equal(value.fsPath, expected, 'Result for ' + input);
	// 		var value2 = Uri.file(value.fsPath);
	// 		assert.equal(value2.fsPath, expected, 'Result for ' + input);
	// 		assert.equal(value.toString(), value2.toString());
	// 	};

	// 	test('file:///c:/alex.txt', 'c:\\alex.txt');
	// 	test('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins', 'c:\\Source\\Zürich or Zurich (ˈzjʊərɪk,\\Code\\resources\\app\\plugins');
	// 	test('file://monacotools/folder/isi.txt', '\\\\monacotools\\folder\\isi.txt');
	// 	test('file://monacotools1/certificates/SSL/', '\\\\monacotools1\\certificates\\SSL\\');
	// });

	test('URI - http, query & toString', function () {

		let uri = Uri.parse('https://go.microsoft.com/fwlink/?LinkId=518008');
		assert.equal(uri.query, 'LinkId=518008');
		assert.equal(uri.toString(true), 'https://go.microsoft.com/fwlink/?LinkId=518008');
		assert.equal(uri.toString(), 'https://go.microsoft.com/fwlink/?LinkId%3D518008');

		let uri2 = Uri.parse(uri.toString());
		assert.equal(uri2.query, 'LinkId=518008');
		assert.equal(uri2.query, uri.query);

		uri = Uri.parse('https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
		assert.equal(uri.query, 'LinkId=518008&foö&ké¥=üü');
		assert.equal(uri.toString(true), 'https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
		assert.equal(uri.toString(), 'https://go.microsoft.com/fwlink/?LinkId%3D518008%26fo%C3%B6%26k%C3%A9%C2%A5%3D%C3%BC%C3%BC');

		uri2 = Uri.parse(uri.toString());
		assert.equal(uri2.query, 'LinkId=518008&foö&ké¥=üü');
		assert.equal(uri2.query, uri.query);
	});
});