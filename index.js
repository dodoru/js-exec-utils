const child_process = require("child_process");

function bool_val(v) {
    if (!v) {
        return false;
    }
    const ns = ["", "0", "false", "no", "n", "f"];
    if (typeof (v) === "string") {
        v = v.trim().toLowerCase();
        if (ns.indexOf(v) > -1) {
            return false;
        }
    }
    return Boolean(v);
}

const self = module.exports = {
    name: "js-exec-utils",
    tips: "manage js-scripts and execute your script commands. \n\n eg: node script.js funcName [...args]",
    logger: global.logger || console,
    config: {
        DEBUG: bool_val(process.env.DEBUG),
        LOG_LEVEL: process.env.LOG_LEVEL || "info",       // default:info ;  debug, info, warn, error, trace
        LOG_DEPTH: parseInt(process.env.LOG_DEPTH) || 0,  // default: 0   ;  loop depth of stringify object
        DISABLE_LOOP: bool_val(process.env.DISABLE_LOOP), // default:false ; don't run sub-job
    },
    _log: (...args) => {
        let calv = self.config.LOG_LEVEL.toLowerCase();
        let func = self.logger[calv] || console.log;
        if (self.config.TIME_FORMAT) {
            func(new Date().toJSON(), ...args);
        } else {
            func(...args);
        }
    },
    _log_ts: (start_ts) => {
        let t1 = new Date(start_ts);
        let t2 = new Date();
        self._log(`//spend ${t2.valueOf() - t1.valueOf()} ms, finish@${t2.toJSON()}, start@${t1.toJSON()}`);
    },

    execCommand: async (cmd, exit_if_finish = false) => {
        const exec = new Promise(function (resolve, reject) {
            let t1 = new Date();
            child_process.exec(cmd, (stdout, stderr, error) => {
                let code = 0;
                self._log(`[cmd]:${cmd}\n[stdout]:${stdout}\n[stderr]:${stderr}`);
                if (error) {
                    console.log("[ERROR]", error);
                    reject(error);
                    code = 1;
                } else {
                    resolve({stdout, stderr, error});
                }
                if (exit_if_finish) {
                    process.exit(code);
                }
                self._log_ts(t1);
                return code;
            });
        });
        return await exec;
    },

    execModule: async (jobModule, funcName, ...funcArgs) => {
        // support loop to execute sub-job of jobModule by setting process.env.DISABLE_LOOP = True
        const func = jobModule[funcName];
        if (func instanceof Function) {
            let res = await func(...funcArgs);
            return res;
        } else if (func !== undefined) {
            if ((funcArgs.length > 0) && (func instanceof Object) && !self.config.DISABLE_LOOP) {
                return self.execModule(func, ...funcArgs);
            } else {
                self._log(`[$.${funcName}]=${func}`);  // funcName => Attribute Arguments
                return func;
            }
        } else {
            throw new Error(`$.${funcName}(${funcArgs}) is undefined`);
        }
    },

    descJobFuncs: (jobModule) => {
        jobModule = jobModule || ".";
        if (typeof (jobModule) === "string") {
            jobModule = require(jobModule);
        }
        if (typeof (jobModule) !== "object") {
            console.log("require $descJobFuncs(<object: jobModule>)");
            process.exit(1);
        }
        console.log(`[tips] ${jobModule.tips} \n`);
        if (jobModule.config) {
            console.log(`[config]: ${self.stringify(jobModule.config, 2, 2)}\n`);
        }
        // ignore function's name startsWith "_"
        console.log("[Functions]: ");
        for (let k in jobModule) {
            if (!k.startsWith("_")) {
                let pf = jobModule[k];
                if (pf instanceof Function) {
                    let desc = pf.toString().split("=>")[0];
                    console.log(`  ${k.padEnd(32, " ")} : ${desc}`);
                }
            }
        }
    },

    descJobAttrs: (jobModule) => {
        // ignore attribute's name startsWith "_"
        jobModule = jobModule || ".";
        if (typeof (jobModule) === "string") {
            jobModule = require(jobModule);
        }
        if (typeof (jobModule) !== "object") {
            console.log("require $descJobAttrs(<object: jobModule>)");
            process.exit(1);
        }
        for (let k in jobModule) {
            if (!k.startsWith("_")) {
                let pf = jobModule[k];
                if (!(pf instanceof Function)) {
                    let desc = pf.toString().split("=>")[0];
                    console.log(`  ${k.padEnd(32, " ")} : ${desc}`);
                }
            }
        }
    },

    stringify: (obj, depth = 0, indent_space = 2) => {
        try {
            return JSON.stringify(obj, null, indent_space);
        } catch (e) {
            if ((obj instanceof Object) && depth >= 0) {
                if (obj.toJSON instanceof Function) {
                    return obj.toJSON();
                }
                let res = {};
                for (let k in obj) {
                    if (!k.startsWith("_")) {
                        let v = obj[k];
                        if (v instanceof Function) {
                            if (self.config.DEBUG) {
                                res[k] = "$Funciton";
                            }
                        } else {
                            res[k] = self.stringify(v, depth - 1, indent_space);
                        }
                    }
                }
                return JSON.stringify(res, null, 2);
            } else {
                return `${obj}`;
            }
        }
    },

    runIfMain: (filename, exports, exit_ok = true) => {
        if (process.mainModule.filename === filename) {
            const args = process.argv.splice(2);
            if (args.length > 0) {
                let t1 = new Date();
                self.execModule(exports, ...args).then(res => {
                    self._log(`[RES]: ${self.stringify(res, self.config.LOG_DEPTH)}`);
                    self._log_ts(t1);
                    if (exit_ok) {
                        process.exit(0);
                    }
                }).catch(err => {
                    self._log(`[ERROR]: ${err.message} at file:${filename}`);
                    self.descJobFuncs(exports);
                    process.exit(1);
                });
            } else {
                self.descJobFuncs(exports);
                process.exit(1);
            }
        }
    },

};

self.runIfMain(__filename, self);
