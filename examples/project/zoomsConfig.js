
// This file can be omitted if the following options are all the default value.
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

		// If it is true, the function list in file "zooms/services.js" will be compact like below right.
		// 		s1: {										s1: {
		//			hi: async function(name, age) {}	=> 		hi(name, age) {}
		// 		}											}
		isCompact: false,

		useArrowFunction: true,
	},
};

module.exports = me;
