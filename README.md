
# Zooms

A module management tools for [Node.js](https://nodejs.org), easily reference external modules from any location, so that the code editors (such as VS Code and WebStorm) can correctly handles the reference (including code completion, navigation, document lookup) without TypeScript community stubs (TypeScript definition files).

Zooms is used to load modules on the same machine. If you want to load modules which are on different machines, you need to use the RPC framework, and [Booms](https://github.com/hiowenluke/booms) is recommended. 

## Install

```sh
npm install zooms --save
```

## TRY IT!

### 1. Download this repo first

```sh
git clone https://github.com/hiowenluke/zooms.git
cd zooms
npm install
```

### 2. Run examples

```sh
node examples/project
```

Results:

```sh
Module #1
Module #2
{ msg: 'Hi, I am owen, 100 years old.' }
hi, 3
```

See [examples/project](./examples/project) to learn more.

## List of functions

The "[example/project](./examples/project)" loads the list of functions definition in external modules like below:

```js
const {m1} = require('zooms/modules');
```

Click above "[zooms/modules.js](./modules.js)" in your code editor (such as VS Code or WebStorm) to view it:

```js
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
...
```

Or with arrow functions like below:

```js
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
...
```

Or with compact mode like below: 

```js
const apis = {
    m1: {
        about(){require('/MyNodeJS/zooms/examples/module1/src/about')},
        callback(hi, cb){require('/MyNodeJS/zooms/examples/module1/src/callback')},
        say: {
            async hi(name, age){require('/MyNodeJS/zooms/examples/module1/src/say/hi')}
        }
    },
    m2: {
        async about(){require('/MyNodeJS/zooms/examples/module2/src/about')}
    }
};
...
```

Or with relative path like below (works in VS Code, not works in WebStorm):

```js
const apis = {
    m1: {
        about(){require('../module1/src/about')},
        callback(hi, cb){require('../module1/src/callback')},
        say: {
            async hi(name, age){require('../module1/src/say/hi')}
        }
    },
    m2: {
        async about(){require('../module2/src/about')}
    }
};
...
```

See [options](#Options) to learn more.

## Options

Create file "zoomsConfig.js" under your project root path. 

```js
module.exports = {

    // The list of external modules
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

    // For file "zooms/modules.js"
    functionList: {

        // If it is true, the function list will be compact like below right.
        // You should to always use "await" keyword to call these functions.
        //         m1: {                                        m1: {
        //            hi: async function(name, age) {}    =>         hi(name, age) {}
        //         }                                            }
        isCompact: false,

        // The useArrowFunction is true only takes effect when isCompact is false
        useArrowFunction: true,

        // The relative path is works in VS Code and not works in WebStorm.
        useRelativePath: false,
    },

};
```

[Demo](./examples/project/zoomsConfig.js)

## Test

Download this repo first (see [TRY IT](#try-it)) if not yet, then:

```sh
npm test
```

## Why Zooms

In a node.js project, when referencing external modules, code editors (such as VS Code and WebStorm) may fail to identify the references correctly (the navigation and documentation lookup are failed). Zooms solves this problem well.

## License

[MIT](LICENSE)

Copyright (c) 2019, Owen Luke
