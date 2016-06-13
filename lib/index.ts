/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

function _encode(ch: string): string {
	return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
}

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function encodeURIComponent2(str: string): string {
	return encodeURIComponent(str).replace(/[!'()*]/g, _encode);
}

function encodeNoop(str: string): string {
	return str;
}


/**
 * Uniform Resource Identifier (Uri) http://tools.ietf.org/html/rfc3986.
 * This class is a simple parser which creates the basic component paths
 * (http://tools.ietf.org/html/rfc3986#section-3) with minimal validation
 * and encoding.
 *
 *       foo://example.com:8042/over/there?name=ferret#nose
 *       \_/   \______________/\_________/ \_________/ \__/
 *        |           |            |            |        |
 *     scheme     authority       path        query   fragment
 *        |   _____________________|__
 *       / \ /                        \
 *       urn:example:animal:ferret:nose
 *
 *
 */
export default class Uri {

	private static _empty = '';
	private static _slash = '/';
	private static _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
	private static _driveLetterPath = /^\/[a-zA-z]:/;
	private static _upperCaseDrive = /^(\/)?([A-Z]:)/;

	private _scheme: string;
	private _authority: string;
	private _path: string;
	private _query: string;
	private _fragment: string;
	private _formatted: string;
	private _fsPath: string;

	constructor() {
		this._scheme = Uri._empty;
		this._authority = Uri._empty;
		this._path = Uri._empty;
		this._query = Uri._empty;
		this._fragment = Uri._empty;

		this._formatted = null;
		this._fsPath = null;
	}

	/**
	 * scheme is the 'http' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part before the first colon.
	 */
	get scheme() {
		return this._scheme;
	}

	/**
	 * authority is the 'www.msft.com' part of 'http://www.msft.com/some/path?query#fragment'.
	 * The part between the first double slashes and the next slash.
	 */
	get authority() {
		return this._authority;
	}

	/**
	 * path is the '/some/path' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	get path() {
		return this._path;
	}

	/**
	 * query is the 'query' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	get query() {
		return this._query;
	}

	/**
	 * fragment is the 'fragment' part of 'http://www.msft.com/some/path?query#fragment'.
	 */
	get fragment() {
		return this._fragment;
	}

	// ---- filesystem path -----------------------

	/**
	 * Returns a string representing the corresponding file system path of this Uri.
	 * Will handle UNC paths and normalize windows drive letters to lower-case. Also
	 * uses the platform specific path separator. Will *not* validate the path for
	 * invalid characters and semantics. Will *not* look at the scheme of this Uri.
	 */
	get fsPath() {
		if (!this._fsPath) {
			var value: string;
			if (this._authority && this.scheme === 'file') {
				// unc path: file://shares/c$/far/boo
				value = `//${this._authority}${this._path}`;
			} else if (Uri._driveLetterPath.test(this._path)) {
				// windows drive letter: file:///c:/far/boo
				value = this._path[1].toLowerCase() + this._path.substr(2);
			} else {
				// other path
				value = this._path;
			}
			if (isWindows) {
				value = value.replace(/\//g, '\\');
			}
			this._fsPath = value;
		}
		return this._fsPath;
	}

	// ---- modify to new -------------------------

	/**
	 * Derive a new Uri from this Uri.
	 *
	 * @param change An object that describes a change to this Uri.
	 * @return A new Uri that reflects the given change. Will return `this` Uri if the change
	 *  is not changing anything.
	 * @sample ```
		let file = Uri.parse('before:some/file/path');
		let other = file.with({ scheme: 'after' });
		assert.ok(other.toString() === 'after:some/file/path');
		* ```
		*/
	public with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {

		if (!change) {
			return this;
		}

		let scheme = change.scheme || this.scheme;
		let authority = change.authority || this.authority;
		let path = change.path || this.path;
		let query = change.query || this.query;
		let fragment = change.fragment || this.fragment;

		if (scheme === this.scheme
			&& authority === this.authority
			&& path === this.path
			&& query === this.query
			&& fragment === this.fragment) {

			return this;
		}

		const ret = new Uri();
		ret._scheme = scheme;
		ret._authority = authority;
		ret._path = path;
		ret._query = query;
		ret._fragment = fragment;
		Uri._validate(ret);
		return ret;
	}

	// ---- parse & validate ------------------------

	/**
	 * Create an Uri from uri components.
	 *
	 * @param components An object containing the Uri components
	 * @return A new Uri instance
	 */
	public static from(components: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
		if (!components) {
			throw new Error();
		}
		return new Uri().with(components);
	}

	/**
	 * Create an Uri from a string. Will throw if the given value is not
	 * valid.
	 *
	 * @param value The string value of an Uri.
	 * @return A new Uri instance.
	 */
	public static parse(value: string): Uri {
		const ret = new Uri();
		const data = Uri._parseComponents(value);
		ret._scheme = data.scheme;
		ret._authority = decodeURIComponent(data.authority);
		ret._path = decodeURIComponent(data.path);
		ret._query = decodeURIComponent(data.query);
		ret._fragment = decodeURIComponent(data.fragment);
		Uri._validate(ret);
		return ret;
	}

	/**
	 * Create an Uri from a file system path. The [scheme](#Uri.scheme)
	 * will be `file`.
	 *
	 * @param path A file system or UNC path.
	 * @return A new Uri instance.
	 */
	public static file(path: string): Uri {

		const ret = new Uri();
		ret._scheme = 'file';

		// normalize to fwd-slashes
		path = path.replace(/\\/g, Uri._slash);

		// check for authority as used in UNC shares
		// or use the path as given
		if (path[0] === Uri._slash && path[0] === path[1]) {
			let idx = path.indexOf(Uri._slash, 2);
			if (idx === -1) {
				ret._authority = path.substring(2);
			} else {
				ret._authority = path.substring(2, idx);
				ret._path = path.substring(idx);
			}
		} else {
			ret._path = path;
		}

		// Ensure that path starts with a slash
		// or that it is at least a slash
		if (ret._path[0] !== Uri._slash) {
			ret._path = Uri._slash + ret._path;
		}

		Uri._validate(ret);

		return ret;
	}

	private static _parseComponents(value: string): UriComponents {

		const ret: UriComponents = {
			scheme: Uri._empty,
			authority: Uri._empty,
			path: Uri._empty,
			query: Uri._empty,
			fragment: Uri._empty,
		};

		const match = Uri._regexp.exec(value);
		if (match) {
			ret.scheme = match[2] || ret.scheme;
			ret.authority = match[4] || ret.authority;
			ret.path = match[5] || ret.path;
			ret.query = match[7] || ret.query;
			ret.fragment = match[9] || ret.fragment;
		}
		return ret;
	}

	private static _validate(ret: Uri): void {

		// validation
		// path, http://tools.ietf.org/html/rfc3986#section-3.3
		// If a Uri contains an authority component, then the path component
		// must either be empty or begin with a slash ("/") character.  If a Uri
		// does not contain an authority component, then the path cannot begin
		// with two slash characters ("//").
		if (ret.authority && ret.path && ret.path[0] !== '/') {
			throw new Error('[UriError]: If a Uri contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
		}
		if (!ret.authority && ret.path.indexOf('//') === 0) {
			throw new Error('[UriError]: If a Uri does not contain an authority component, then the path cannot begin with two slash characters ("//")');
		}
	}

	// ---- printing/externalize ---------------------------

	/**
	 *
	 * @param skipEncoding Do not encode the result, default is `false`
	 */
	public toString(skipEncoding: boolean = false): string {
		if (!skipEncoding) {
			if (!this._formatted) {
				this._formatted = Uri._asFormatted(this, false);
			}
			return this._formatted;
		} else {
			// we don't cache that
			return Uri._asFormatted(this, true);
		}
	}

	private static _asFormatted(uri: Uri, skipEncoding: boolean): string {

		const encoder = !skipEncoding
			? encodeURIComponent2
			: encodeNoop;

		const parts: string[] = [];

		let {scheme, authority, path, query, fragment} = uri;
		if (scheme) {
			parts.push(scheme, ':');
		}
		if (authority || scheme === 'file') {
			parts.push('//');
		}
		if (authority) {
			authority = authority.toLowerCase();
			let idx = authority.indexOf(':');
			if (idx === -1) {
				parts.push(encoder(authority));
			} else {
				parts.push(encoder(authority.substr(0, idx)), authority.substr(idx));
			}
		}
		if (path) {
			// lower-case windown drive letters in /C:/fff
			const m = Uri._upperCaseDrive.exec(path);
			if (m) {
				path = m[1] + m[2].toLowerCase() + path.substr(m[1].length + m[2].length);
			}

			// encode every segement but not slashes
			// make sure that # and ? are always encoded
			// when occurring in paths - otherwise the result
			// cannot be parsed back again
			let lastIdx = 0;
			while (true) {
				let idx = path.indexOf(Uri._slash, lastIdx);
				if (idx === -1) {
					parts.push(encoder(path.substring(lastIdx)).replace(/[#?]/, _encode));
					break;
				}
				parts.push(encoder(path.substring(lastIdx, idx)).replace(/[#?]/, _encode), Uri._slash);
				lastIdx = idx + 1;
			};
		}
		if (query) {
			parts.push('?', encoder(query));
		}
		if (fragment) {
			parts.push('#', encoder(fragment));
		}

		return parts.join(Uri._empty);
	}

	public toJSON(): any {
		return <UriComponents>{
			scheme: this.scheme,
			authority: this.authority,
			path: this.path,
			fsPath: this.fsPath,
			query: this.query,
			fragment: this.fragment
		};
	}
}

interface UriComponents {
	scheme: string;
	authority: string;
	path: string;
	query: string;
	fragment: string;
}

// OS detection
declare const process: { platform: 'win32' };
declare const navigator: { userAgent: string };
let isWindows: boolean;
if (typeof process === 'object') {
	isWindows = process.platform === 'win32';
} else if (typeof navigator === 'object') {
	let userAgent = navigator.userAgent;
	isWindows = userAgent.indexOf('Windows') >= 0;
}
