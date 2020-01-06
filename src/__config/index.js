
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
		isCompact: false,

		// The useArrowFunction is true only takes effect when isCompact is false
		useArrowFunction: false,
	},

	yesZoomsModulesFile: false,
};

module.exports = me;
