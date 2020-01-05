
const {m1, m2} = require('../../modules');

const main = async function () {
	let result;

	result = m1.about();
	console.log(result); // "Module #1"

	result = await m2.about();
	console.log(result); // "Module #2"

	result = await m1.say.hi('owen', 100);
	console.log(result); // { msg: 'Hi, I am owen, 100 years old.' }

	const x = 1;
	result = m1.callback('hi', function (y) {
		// The argument y is passed from this module, its value is 2
		return x + y;
	});
	console.log(result); // "hi, 3"
};

main();
