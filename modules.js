
const apis = {
	m1: {
		about: function() {
			require('./examples/module1/src/about.js')
		},

		callback: function(hi, cb) {
			require('./examples/module1/src/callback.js')
		},

		say: {
			hi: async function(name, age) {
				require('./examples/module1/src/say/hi.js')
			}
		}
	},

	m2: {
		about: async function() {
			require('./examples/module2/src/about.js')
		}
	}
};

module.exports = apis; (() => {module.exports = require('./src').do(module.parent.filename)})();
