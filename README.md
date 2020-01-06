
# Zooms

A module management tools for [Node.js](https://nodejs.org), easily reference external modules from any location, and the code editors (such as VS Code and WebStorm) can correctly handles the navigation and document lookup without TypeScript community stubs (TypeScript definition files).

Zooms is used to load modules on the same machine. If you want to load modules which are on different machines, you should use the RPC framework, and [Booms](https://github.com/hiowenluke/booms) is recommended. 

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

Click above "[zooms/modules.js](./modules.js)" in your code editor to view it. Note that the require here is just to provide a file link for the code editor, not for runtime.

```js
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
...
```

With arrow function:

```js
const apis = {
    m1: {
        about: () => {
            require('./examples/module1/src/about.js')
        },
        
        callback: (hi, cb) => {
            require('./examples/module1/src/callback.js')
        },
        
        say: {
            hi: async (name, age) => {
                require('./examples/module1/src/say/hi.js')
            }
        }
    },
    
    m2: {
        about: async () => {
            require('./examples/module2/src/about.js')
        }
    }
};
...
```

With compact mode:

```js
const apis = {
    m1: {
        about() {
            require('./examples/module1/src/about.js')
        },
        
        callback(hi, cb) {
            require('./examples/module1/src/callback.js')
        },
        
        say: {
            async hi(name, age) {
                require('./examples/module1/src/say/hi.js')
            }
        }
    },
    
    m2: {
        async about() {
            require('./examples/module2/src/about.js')
        }
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
        //         m1: {                                        m1: {
        //            hi: function(name, age) {}    =>              hi(name, age) {}
        //         }                                            }
        isCompact: false, // default

        // The useArrowFunction is true only takes effect when isCompact is false
        useArrowFunction: false, // default
    },

	// Run index.js in the root directory of the modules
	isRunModuleIndexJs: true, // default
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
