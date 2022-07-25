//引入fs库
const fs = require('fs');

const encode_file = "./decode.js",
    replace_file = "./replace_code.js";

const jscode = fs.readFileSync(encode_file, {
    encoding: "utf-8"
});


//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;





//转换为ast树
var ast = parser.parse(jscode)


var code = generator(ast, {
    compact: true, // 压缩格式
    comments: false, // 注释
    jsescOption: {
        "minimal": true // 转义
        }
    }).code;
fs.writeFile(replace_file, code, (err) => {});






