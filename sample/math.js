
const {runIfMain} = require("js-exec-utils");

module.exports = {
    name: 'math calculator',
    tips: `node ${__filename} sum ...args \n eg: node math.js sum 1 2 3 4`,
    sum: (...args) => {
        return [0, ...args].reduce((a, b) => Number(a) + Number(b));
    }
};

runIfMain(__filename, module.exports);
