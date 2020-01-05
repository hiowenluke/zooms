
const fn = (hi, cb) => {
	const cbResult = cb(2);
	return hi + ', ' + cbResult;
};

module.exports = fn;
