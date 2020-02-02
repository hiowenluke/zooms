
const fs = require('fs');
const path = require('path');

const kdo = require('kdo');
const keyPaths = require('keypaths');
const removeRedundantTabs = require('removeredundanttabs');

const config = require('./__config');
const lib = require('./__lib');

const zoomsRoot = path.resolve(__dirname, '..');
const modulesJs = zoomsRoot + '/modules.js';

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
		seekFile(startingDir, '.zoomsConfig.js')
	;

	if (!targetFile) {
		throw new Error(`Can not find zoomsConfig.js in current project root path`);
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

		// Run index.js in the root directory of the modules
		if (userConfig.isRunModuleIndexJs) {
			require(modulePath);
		}

		const apis = keyPaths.toPaths(source);
		const fnParamsStr = {};
		const fnAsync = {};
		const fnPath = {};

		apis.forEach(api => {
			const fn = keyPaths.get(source, api);
			fnParamsStr[api] = lib.retrieveParamsStr(fn);
			fnAsync[api] = fn.constructor.name === 'AsyncFunction';

			// Convert absolute path to relative path of zoomsRoot
			let filePath = libPath + '/' + api.replace(/\./g, '/') + '.js';
			filePath = path.relative(zoomsRoot, filePath);

			// "examples/module1" => "./examples/module1"
			const fc = filePath.substr(0, 1);
			if (fc !== '.' && fc !== '/') {
				filePath = './' + filePath;
			}

			fnPath[api] = filePath;
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
			return `^^${asyncStr}function(${paramsStr}) {require('${filePath}')}^^`;
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

const genApisStr = (options, apis) => {
	let apisStr = stringify(apis);

	// "^^async function() {}^^" => async function() {}
	apisStr = apisStr.replace(/("\^\^)|(\^\^")/g, '');

	// hi: async function (name, age) {} => hi(name, age) {}
	if (options.isCompact) {
		apisStr = apisStr.replace(/\b(\S*?): (async )*function\s*?(?=\()/g, '$2$1')
	}
	else {
		if (options.useArrowFunction) {
			apisStr = apisStr
				.replace(/function/g, '')
				.replace(/\) {require/g, ') => {require')
			;
		}
	}

	return apisStr;
};

const genContentForZoomsModulesJs = (apisStr) => {
	let content = `
		const apis = ${apisStr};
		
		module.exports = apis;
	`;

	content = removeRedundantTabs(content, true);
	content = content.replace(/ {4}/g, '\t');

	// Beautify line require
	const lines = content.split('\n');
	const newLines = lines.map(line => {
		let indent = line.match(/(\t\t\t*?)\b([\s\S]+?(?=\())/);
		if (!indent) return line;

		indent = indent[0].replace(/\b[\s\S]*$/, '');

		return line
			.replace(/^(\t+?)\b([\s\S]*?){require\(/, '$1$2{\n$1\trequire(')
			.replace(/}([,]*)$/, '\n' + indent + '}$1\n')
			;
	});
	content = newLines.join('\n');

	content = content
		.replace(/^/, '\n')
		.replace(/}\n\n(\t+?)}/g, '}\n$1}')
		.replace(/}(,*)(\s*?)},/g, '}$1$2},\n')
	;

	return content;
};

const writeToDataFile = (clientRoot, userConfig, apis) => {
	const apisStr = genApisStr(userConfig.functionList, apis);

	// For zooms/modules.js
	const content = genContentForZoomsModulesJs(apisStr);

	// Output to file modulesFilePath
	lib.replaceInFile(modulesJs, /^[\s\S]*module\.exports = apis;/, content);

	// Create zoomsModules.js for user to view all apis information.
	if (userConfig.yesZoomsModulesFile) {
		const targetFile = clientRoot + '/zoomsModules.js';
		fs.copyFileSync(modulesJs, targetFile);

		// Remove the below code at the end of the file:
		// 		(() => {module.exports = require('./src').do(module.parent.filename)})();
		const content = fs.readFileSync(targetFile, 'utf-8');
		const newContent = content.replace(/ \(\(\) =>[\s\S]*$/, '');
		fs.writeFileSync(targetFile, newContent, 'utf-8');
	}
};

const loadModules = (parentFilename) => {
	if (!isInitialized) {
		const clientRoot = getClientRoot(parentFilename);
		const userConfig = getUserConfig(clientRoot);
		initSources(clientRoot, userConfig);

		const apis = parseSourcesApis(userConfig);
		writeToDataFile(clientRoot, userConfig, apis);

		isInitialized = 1;
	}

	return runtimeApis;
};

const fn = (parentFilename, relativePath) => {
	const c = relativePath.substr(0, 1);

	const clientRoot = getClientRoot(parentFilename);
	const userConfig = getUserConfig(clientRoot);

	let libName;

	// It is a path
	if (c === '.' || c === '/') {
		const options = userConfig.modules.find(options => options.path === relativePath);
		libName = options ? options.lib : '';
	}
	else {
		// It is a name of relative path
		const name = relativePath;
		const options = userConfig.modules.find(options => options.name === name);
		if (!options) {
			throw new Error(`Can not find "${name}" in zoomsConfig.js`);
		}

		relativePath = options.path;
		libName = options.lib;
	}

	const dir = path.resolve(clientRoot, relativePath);
	const lib = kdo(dir + (libName ? '/' + libName : ''));

	// create api function list
	setTimeout(() => {
		loadModules(parentFilename);
	}, 1000);

	return lib;
};

fn.loadModules = loadModules;
module.exports = fn;
