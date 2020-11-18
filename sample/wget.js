const fs = require("fs");
const URL = require("url");
const http = require("http");
const https = require("https");

const {runIfMain} = require("js-exec-utils");
const job_name = __filename.split('/').pop().split('.')[0];

const self = module.exports = {
    name: job_name,
    tips: "test sample of js-exec-utils \n eg: node wget.js get https://www.npmjs.com/search?q=js",
    parse: (url) => URL.parse(url),
    echo: (...args) => console.log("runing echo:", ...args),
    get: async (url, output_file) => {
        let callAsyc = (url) => {
            let options = URL.parse(url);
            output_file = output_file || `${options.host}.html`;
            options.headers = {'User-Agent': 'nodejs request'};
            let cli = url.startsWith("https") ? https : http;
            return new Promise((resolve, reject) => {
                let req = cli.get(options, (res) => {
                    if (res.statusCode === 301 || res.statusCode === 302) {
                        let url2 = res.headers.location;
                        if (url2.startsWith("/")) {
                            url2 = `${options.protocol}//${options.host}${res.headers.location}`;
                        }
                        console.log(`[{${res.statusCode}}] ${url2}`);
                        return resolve(callAsyc(url2));
                    }
                    console.log("headers: ", res.headers);

                    let data = "";
                    res.on('data', (chunk) => {
                        data += chunk;
                        fs.writeFileSync(output_file, chunk, {flag: "a+"});
                    });
                    res.on('end', (chunk) => {
                        resolve({
                            url: url,
                            statusCode: res.statusCode,
                            dataSize: data.length,
                            dstpath: output_file,
                            getData: () => data,
                        });
                    }).on("error", (err) => {
                        reject(err);
                    });
                });
                req.end();
            });
        };
        return await callAsyc(url);
    },
};

runIfMain(__filename, self);
