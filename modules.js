const apis = {
    m1: {
        about: () => {require('/MyNodeJS/zooms/examples/module1/src/about')},
        callback: (hi, cb) => {require('/MyNodeJS/zooms/examples/module1/src/callback')},
        say: {
            hi: async (name, age) => {require('/MyNodeJS/zooms/examples/module1/src/say/hi')}
        }
    },
    m2: {
        about: async () => {require('/MyNodeJS/zooms/examples/module2/src/about')}
    }
};

module.exports = apis; (() => {module.exports = require('./src').do(module.parent.filename)})();
