const apis = {
    m1: {
        about: function(){require('/MyNodeJS/zooms/examples/module1/src/about')},
        callback: function(hi, cb){require('/MyNodeJS/zooms/examples/module1/src/callback')},
        say: {
            hi: async function(name, age){require('/MyNodeJS/zooms/examples/module1/src/say/hi')}
        }
    },
    m2: {
        about: async function(){require('/MyNodeJS/zooms/examples/module2/src/about')}
    }
};

module.exports = apis; (() => {module.exports = require('./src').do(module.parent.filename)})();
