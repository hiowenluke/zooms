
// This file can be a hidden file ".zoomsConfig.js"

const me = {

	modules: [
		{
			name: 'm1',
			path: '../module1',
			lib: 'src'
		},

		{
			name: 'm2',
			path: '../module2',
			lib: 'src'
		}
	],

	functionList: {

		// If it is true, the function list in file "zooms/modules.js" will be compact like below right.
		// 		s1: {										s1: {
		//			hi: function(name, age) {}	=> 				hi(name, age) {}
		// 		}											}
		isCompact: false, // default

		// The useArrowFunction is true only takes effect when isCompact is false
		useArrowFunction: false, // default
	},

	// Run index.js in the root directory of the modules
	isRunModuleIndexJs: true, // default
};

module.exports = me;
