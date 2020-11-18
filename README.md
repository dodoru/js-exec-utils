# js-exec-utils

#### 介绍
nodejs 任务/脚本/命令运行的工具库

#### 安装教程

    npm install js-exec-utils

#### 使用说明

eg: sample/math.js
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

可执行 shell 命令: `cd sample && node math.js sum 1 2 3 4`
 