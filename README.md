# js-exec-utils

#### 介绍
nodejs: 支持命令行运行js脚本/模块/包/函数

#### 安装教程

    npm install js-exec-utils

#### 使用说明

eg: math.js
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

可执行 shell 命令: `node math.js sum 1 2 3 4`
 