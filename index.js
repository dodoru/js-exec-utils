const child_process = require("child_process");

function bool_val(v, false_alias) {
    if (!v) {
        return false;
    }
    const ns = ["", "0", "false", "[]", "{}", "null", "undefined"];
    if (false_alias instanceof Array) {
        ns.push(...false_alias);
    }
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
        DISABLE_SEEK: bool_val(process.env.DISABLE_SEEK), // default:false ; run sub-job
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

    reprFunction: (func) => {
        // represent function as a string
        // typeof (func) === "function"
        let pf = String(func);
        if (pf.startsWith("function ")) {
            let r = new RegExp("\\)[\\s]*\\{");
            let repr = pf.split(r, 1)[0];
            return `${repr})`;
        } else {
            let repr = pf.split("=>", 1)[0];
            return `${repr}`;
        }
    },

    reprObject: (obj) => {
        // represent object as a string
        // typeof (obj) === "object"
        let v = undefined;
        try {
            v = JSON.stringify(obj, null, 2);
        } catch (e) {
            self._log(e);
        }
        if (v === undefined && (obj !== undefined)) {
            v = `${obj.__proto__.constructor.name}: ${obj}`;
        }
        return v;
    },

    parseValue: (v) => {
        let tp = typeof (v);
        if (tp === "function") {
            return {is_true: true, repr: self.reprFunction(v), value: v};
        } else {
            if (tp === "object" && v !== null) {
                let repr = self.reprObject(v);
                return {is_true: bool_val(repr), repr: repr, value: v};
            } else {
                return {is_true: Boolean(v), repr: String(v), value: v};
            }
        }
    },

    reprJobProperty: (jobModule, attr) => {
        let v = jobModule[attr];
        let lines = [];
        lines.push(`[${attr}] : `);
        if (v instanceof Array) {
            let ns = v.map((e, i) => `\t${self.parseValue(e).repr}`);
            lines.push(...ns);
        } else {
            lines.push(self.parseValue(v).repr);
        }
        return lines.join("\n");
    },

    execCommand: async (cmd, exit_if_finish = false) => {
        // execute commands with shell (Default: '/bin/sh' on Unix, process.env.ComSpec on Windows.)
        // https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
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
        // default: process.env.DISABLE_SEEK = false, enable to execute deeper function by seeking funcArgs.
        const func = jobModule[funcName];
        if (func instanceof Function) {
            return await func(...funcArgs);
        } else if (func !== undefined) {
            if ((funcArgs.length > 0) && (func instanceof Object) && !self.config.DISABLE_SEEK) {
                return await self.execModule(func, ...funcArgs);
            } else {
                self._log(self.reprJobProperty(jobModule, funcName));  // funcName => Attribute Arguments
                return await func;
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
        if (jobModule.config) {
            self._log(`[config]: ${self.stringify(jobModule.config, 2, 2)}\n`);
        }
        // ignore function's name startsWith "_"
        console.log("[Functions]: ");
        for (let k of Object.getOwnPropertyNames(jobModule)) {
            if (!k.startsWith("_")) {
                let pf = jobModule[k];
                if (pf instanceof Function) {
                    let desc = self.reprFunction(pf);
                    self._log(`  ${k.padEnd(32, " ")} : ${desc}`);
                }
            }
        }
    },

    descJobAttrs: (jobModule, attr = "**") => {
        // ignore the _attributes (prefix with "_")
        let attrs = Object.keys(jobModule);
        if (attrs.length > 0 && attr === "**") {
            for (let k of attrs) {
                if (!k.startsWith("_")) {
                    let pf = jobModule[k];
                    let pfv = self.parseValue(pf);
                    self._log(`  ${k.padEnd(32, " ")} : ${pfv.repr}`);
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
                for (let k of Object.keys(obj)) {
                    if (!k.startsWith("_")) {
                        let v = obj[k];
                        if (v instanceof Function) {
                            if (self.config.DEBUG) {
                                res[k] = `$Function:: ${self.reprFunction(v)}`;
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
            const args = process.argv.slice(2);
            if (args.length > 0) {
                let t1 = new Date();
                self.execModule(exports, ...args).then(res => {
                    self._log(`[RES]: ${self.stringify(res, self.config.LOG_DEPTH)}`);
                    self._log_ts(t1);
                    if (exit_ok) {
                        process.exit(0);
                    }
                }).catch(err => {
                    self._log(`[ERROR]: ${err.message}`);
                    self._log(`[EXEC_FILE]: ${filename}`);
                    self._log(self.reprJobProperty(exports, "tips"));
                    self.descJobFuncs(exports);
                    process.exit(1);
                });
            } else {
                self._log(self.reprJobProperty(exports, "tips"));
                self.descJobFuncs(exports);
                process.exit(1);
            }
        }
    },

    manageIfMain: (filename, jobs_index, exit_ok = true) => {
        if (process.mainModule.filename === filename) {
            const job = jobs_index[process.argv[2]] || jobs_index[`${process.argv[2]}.js`];
            self._log(self.reprJobProperty(jobs_index, "tips"));
            if (!job) {
                self._log("[jobs]:");
                for (let idx of Object.keys(jobs_index)) {
                    let tk = jobs_index[idx];
                    if (typeof (tk) === "object" && tk.tips) {
                        self._log(self.reprJobProperty(tk, "tips"));
                    } else {
                        self._log(self.parseValue(tk).repr);
                    }
                }
                process.exit(1);
            } else {
                self.runIfMain(filename, jobs_index, exit_ok);
            }

        }
    },
};

self.runIfMain(__filename, self);
