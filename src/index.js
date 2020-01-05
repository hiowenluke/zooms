
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const kdo = require('kdo');
const keyPaths = require('keypaths');
const clear = require('removeredundanttabs');

const config = require('./__config');
const lib = require('./__lib');

let sources = {};
let runtimeApis = {};
let isInitialized;

const stringify = (obj) => {
	const str = JSON.stringify(obj, null, 4);
	return str.replace(/"(\w+)"\s*:/g, '$1:');
};

const getClientRoot = (startingFilename) => {
	const seekFile = (startingDir, filename, cb) => {
		let p = startingDir;

		while (p !== '/') {
			const dest = p + '/' + filename;
			if (fs.existsSync(dest) && (!cb || cb(dest))) {
				return dest;
			}
			p = path.resolve(p, '..');
		}
	};

	const startingDir = path.resolve(startingFilename, '..');
	const targetFile =
		seekFile(startingDir, 'zoomsConfig.js') ||
		seekFile(startingDir, '.zoomsConfig.js') ||
		seekFile(startingDir, 'package.json', (filePath) => {
			const pkg = require(filePath);
			return pkg.dependencies.zooms;
		})
	;

	if (!targetFile) {
		throw new Error(`Can not find package.json or zoomsConfig.js in current project root path`);
	}

	const userRoot = path.resolve(targetFile, '..');
	return userRoot;
};

const getUserConfig = (clientRoot) => {
	const filenames = ['zoomsConfig.js', '.zoomsConfig.js'];
	const filename = filenames.find(filename => fs.existsSync(clientRoot + '/' + filename));

	let userConfig = {};
	if (filename) {
		userConfig = require(clientRoot + '/' + filename);
	}

	const defConfig = {...config};

	Object.keys(defConfig).forEach(key => {
		userConfig[key] = userConfig[key] || defConfig[key];
	});

	return userConfig;
};

const initSources = (clientRoot, userConfig) => {
	sources = {};
	runtimeApis = {};

	const defs = userConfig.modules;
	defs.forEach(options => {
		let name = options.name;
		let modulePath = options.path;
		let libName = options.lib;

		// Convert relative path to absolute path
		if (modulePath.substr(0, 1) === '.') {
			modulePath = path.resolve(clientRoot, modulePath);
		}

		const libPath = modulePath + (libName ? '/' + libName : '');
		const source = kdo(libPath);

		const apis = keyPaths.toPaths(source);
		const fnParamsStr = {};
		const fnAsync = {};
		const fnPath = {};

		apis.forEach(api => {
			const fn = keyPaths.get(source, api);
			fnParamsStr[api] = lib.retrieveParamsStr(fn);
			fnAsync[api] = fn.constructor.name === 'AsyncFunction';
			fnPath[api] = libPath + '/' + api.replace(/\./g, '/');
		});

		sources[name] = {apis, fnParamsStr, fnAsync, fnPath};
		runtimeApis[name] = source;
	});
};

const parseSourcesApis = (userConfig) => {
	const parseApiInfos = (obj, {fnParamsStr, fnAsync, fnPath}) => {

		const getFunctionBodyStr = (apiPath) => {
			const paramsStr = fnParamsStr[apiPath];
			const asyncStr = fnAsync[apiPath] ? 'async ' : '';
			const filePath = fnPath[apiPath];

			// "^^async function () {}^^"
			let str = `^^${asyncStr}function(${paramsStr}){require('${filePath}')}^^`;

			if (!userConfig.functionList.isCompact && userConfig.functionList.useArrowFunction) {
				str = str
					.replace('function', '')
					.replace('){require', ') => {require')
				;
			}

			return str;
		};

		const attachFunctionBodyStr = (obj, parent = '') => {
			Object.keys(obj).forEach(key => {
				const node = obj[key];
				const apiPath = parent + key;

				// If it is ending node, replace it with function
				if (!Object.keys(node).length) {
					obj[key] = getFunctionBodyStr(apiPath);
				}
				else {
					// Recursion
					attachFunctionBodyStr(node, apiPath + '.');
				}
			});
		};

		attachFunctionBodyStr(obj);

		return obj;
	};

	const data = {};
	const names = Object.keys(sources);

	for (let i = 0; i < names.length; i ++) {
		const name = names[i];
		const info = sources[name];

		const obj = keyPaths.toObject(info.apis);
		data[name] = parseApiInfos(obj, info);
	}

	return data;
};

const writeToDataFile = (clientRoot, userConfig, apis) => {
	let apisStr = stringify(apis);

	// "^^async function() {}^^" => async function() {}
	apisStr = apisStr.replace(/("\^\^)|(\^\^")/g, '');

	// hi: async function (name, age) {} => hi(name, age) {}
	if (userConfig.functionList.isCompact) {
		apisStr = apisStr.replace(/\b(\S*?): (async )*function\s*?(?=\()/g, '$2$1')
	}

	// For zooms/modules.js
	const modulesFilePath = path.resolve(__dirname, '../modules.js');
	const content = `
		const apis = ${apisStr};
		
		module.exports = apis;
	`;
	lib.replaceInFile(modulesFilePath, /^[\s\S]*module\.exports = apis;/, clear(content));

	// Create zoomsServices.js for user to view all apis information.
	if (userConfig.yesZoomsServicesFile) {
		const sourceFile = modulesFilePath;
		const targetFile = clientRoot + '/zoomsServices.js';
		fs.copyFileSync(sourceFile, targetFile);

		const content = fs.readFileSync(targetFile, 'utf-8');
		const newContent = content.replace(/ \(\(\) =>[\s\S]*$/, '');
		fs.writeFileSync(targetFile, newContent, 'utf-8');
	}
};

const me = {
	do(parentFilename) {
		if (!isInitialized) {
			debugger;
			const clientRoot = getClientRoot(parentFilename);
			const userConfig = getUserConfig(clientRoot);

			this.once(clientRoot, userConfig);
			isInitialized = 1;
		}

		return runtimeApis;
	},

	once(clientRoot, userConfig) {
		initSources(clientRoot, userConfig);

		const servicesApis = parseSourcesApis(userConfig);
		writeToDataFile(clientRoot, userConfig, servicesApis);
	}
};

module.exports = me;
