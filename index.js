
const zooms = require('./src');

const fn = (relativePath) => {
	return zooms(module.parent.filename, relativePath);
};

module.exports = fn;
