# js-exec-utils

#### Description

nodejs: Execute script/module/package/function in shell 

#### Installation

    npm install js-exec-utils

#### UsageSample 

eg: vi sample/math.js

```
const {runIfMain} = require("js-exec-utils");
module.exports = {
    name: 'math calculator',
    tips: `node ${__filename} sum ...args`,
    sum: (...args) => {
        return [0, ...args].reduce((a, b) => Number(a) + Number(b));
    }
};
runIfMain(__filename, module.exports);
```

then shell > `cd sample && node math.js sum 1 2 3 4`
 