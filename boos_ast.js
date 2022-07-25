//引入fs库
const fs = require('fs');

const encode_file = "./code.js",
    decode_file = "./decode.js";
   

const jscode = fs.readFileSync(encode_file, {
    encoding: "utf-8"
});


//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;




//创建一个重新加载的方法
//将ast转化为code写入文件再次导出
function reload(ast){
    var code = generator(ast, {
    compact: false, // 压缩格式
    comments: false, // 注释
    jsescOption: {
        "minimal": true // 转义
        }
    }).code;
    var fd = fs.openSync(decode_file,"w");
    fs.writeSync(fd, code);
    fs.closeSync(fd);
    var readcode = fs.readFileSync(decode_file, {
        encoding: "utf-8"
    });


    return parser.parse(readcode)
}

//转换为ast树
var ast = parser.parse(jscode)

//16进制解混淆 
traverse(ast, {
    "StringLiteral|NumericLiteral" (path) {
        if (path.node.extra && /^0[obx]/i.test(path.node.extra.raw) || path.node.extra && /\\[ux]/gi.test(path.node.extra.raw)) {
            path.node.extar = undefined;
        }


    }
})


// //解密方法
// //拿到astbody中前5个加上最后一个就是解密函数
// //获取解密字符串函数的名字
let decodeAstNode = ast.program.body[0].expression.callee.body.body[ast.program.body[0].expression.callee.body.body.length - 1];
let decodeName = decodeAstNode.id.name;




//接所有的控制流

traverse(ast, {
    //遍历所有的while节点
    WhileStatement(path) {
        //创建一个空字典
        let arrDict = {};
        //创建一个空的节点数组
        let res_path = [];
        let indexs;
        //创建一个空的arr列表，用来存放switch列表的初始
        let arr = [];
        //path.inList判断路径是否有同级节点
        //path.getPrevSibling()，获取当前节点的上一级节点
        //先判断while节点中switch()中的值，判断是列表的调用还是值
        switchNode = path.node.body.body[0]
        //判断switchNode是否为空  switchNode的discriminant.type是否是MemberExpression类型以及property.operator是否是++

        if (switchNode != null && types.isMemberExpression(switchNode.discriminant) && switchNode.discriminant.property.operator == "++") {
            //获取当前节点的上一级节点
            lastNode = path.getPrevSibling().node
            //判断上一级属性的type是否是VariableDeclaration,declarations的长度是否为2,declarations[0]的init是否是Literal declarations[1]的init是否是数组
            if (types.isVariableDeclaration(lastNode) && lastNode.declarations.length == 2 && types.isLiteral(lastNode.declarations[0].init) && types.isArrayExpression(lastNode.declarations[1].init)) {

                //获取上一级节点的初始值和列表
                let index = lastNode.declarations[0].init.value;
                let arr = getArr(lastNode.declarations[1].init.elements)
                let arrname = lastNode.declarations[1].id.name;
                //获取所得到的列表之后删除上一级节点
                path.getPrevSibling().remove()
                //获取switch中的cases列表
                let cases = path.node.body.body[0].cases;
                //创建两个变量，一个控制循环，一个是自增索引
                let whileIndex = 0,
                    control = true;
                while (control) {
                    //循环获取cases中的case
                    if (arr[whileIndex] == undefined) control = false;
                    for (i in cases) {
                        //把arr数组的值跟每个case的value进行比较
                        if (arr[whileIndex] == cases[i].test.value) {
                            //但是还会出现arr数组中的值被添加
                            //获取到case中的代码块
                            conseq = cases[i].consequent;
                            //循环对代码快进行判断
                            for (conse in conseq) {
                                //如果代码块不是break类型就进入，如果是就不处理
                                if (!types.isBreakStatement(conseq[conse])) {
                                    //进入这个分支也会有三种情况
                                    //分三种情况1、列表的定义 2、原列表的添加 3、返回类型
                                    //先判断是否是列表的定义

                                    if (types.isVariableDeclaration(conseq[conse]) && conseq[conse].declarations.length == 1 && types.isArrayExpression(conseq[conse].declarations[0].init) && conseq[conse].declarations[0].init.elements.length != 0) {
                                        //如果确实是列表的定义，就把列表的值提取出来放入到字典中
                                        let value = getArr(conseq[conse].declarations[0].init.elements);
                                        let name = conseq[conse].declarations[0].id.name;
                                        if (arrDict[name] == undefined) {
                                            arrDict[name] = value;
                                        }

                                        //判断是否是原有的列表增加s
                                    } else if (types.isCallExpression(conseq[conse].expression) && conseq[conse].expression.callee.property != undefined && conseq[conse].expression.callee.property.name == "apply" && conseq[conse].expression.arguments.length == 2 && conseq[conse].expression.arguments[0].name == arrname) {
                                        //如果是的话就将列表的中的值增加到arr中
                                        arr = arr.concat(arrDict[conseq[conse].expression.arguments[1].name])

                                        //判断是否是反回值
                                    } else if (types.isReturnStatement(conseq[conse])) {
                                        res_path = res_path.concat(conseq[conse])
                                        //control设为false结束循环
                                        control = false;
                                    } else if (types.isVariableDeclaration(conseq[conse]) && conseq[conse].declarations.length == 1 && types.isMemberExpression(conseq[conse].declarations[0].init) && conseq[conse].declarations[0].init.object.name == arrname && conseq[conse].declarations[0].init.property.name == "p") {

                                        continue;
                                    } else {
                                        //如果上面的三种情况都不属于直接加入到列表中
                                        res_path = res_path.concat(conseq[conse])
                                    }

                                }

                            }
                            //如果不是以break结尾的情况下

                            if (!types.isBreakStatement(cases[i].consequent[cases[i].consequent.length - 1]) && !types.isReturnStatement(cases[i].consequent[cases[i].consequent.length - 1]) && !types.isContinueStatement(cases[i].consequent[cases[i].consequent.length - 1])) {
                                //因为直接向下 所以也就是value的值
                                conseq = cases[cases[i].test.value].consequent

                                for (conse in conseq) {
                                    //如果代码块不是break类型就进入，如果是就不处理
                                    if (!types.isBreakStatement(conseq[conse])) {
                                        //进入这个分支也会有三种情况
                                        //分三种情况1、列表的定义 2、原列表的添加 3、返回类型
                                        //先判断是否是列表的定义

                                        if (types.isVariableDeclaration(conseq[conse]) && conseq[conse].declarations.length == 1 && types.isArrayExpression(conseq[conse].declarations[0].init)) {
                                            //如果确实是列表的定义，就把列表的值提取出来放入到字典中
                                            let value = getArr(conseq[conse].declarations[0].init.elements);
                                            let name = conseq[conse].declarations[0].id.name;
                                            if (arrDict[name] == undefined) {
                                                arrDict[name] = value;
                                            }

                                            //判断是否是原有的列表增加
                                        } else if (types.isCallExpression(conseq[conse].expression) && conseq[conse].expression.callee.property != undefined && conseq[conse].expression.callee.property.name == "apply" && conseq[conse].expression.arguments.length == 2 && conseq[conse].expression.arguments[0].name == arrname) {
                                            //如果是的话就将列表的中的值增加到arr中
                                            arr = arr.concat(arrDict[conseq[conse].expression.arguments[1].name])
                                            //判断是否是反回值
                                        } else if (types.isReturnStatement(conseq[conse])) {
                                            res_path = res_path.concat(conseq[conse])
                                            //control设为false结束循环
                                            control = false;
                                        } else if (types.isVariableDeclaration(conseq[conse]) && conseq[conse].declarations.length == 1 && types.isMemberExpression(conseq[conse].declarations[0].init) && conseq[conse].declarations[0].init.object.name == arrname && conseq[conse].declarations[0].init.property.name == "p") {

                                            continue;
                                        } else {
                                            //如果上面的三种情况都不属于直接加入到列表中
                                            res_path = res_path.concat(conseq[conse])
                                        }

                                    }

                                }
                            }

                        }
                    }
                    whileIndex++
                }
                path.replaceWithMultiple(res_path);
                //判断是否是另外一种控制流
                /**
                 *   var TEm = 14;
                        while (!![]) {
                 *  */
            }
        } else if (switchNode != undefined && types.isIdentifier(switchNode.discriminant)) {
            lastNode = path.getPrevSibling().node
            if (types.isVariableDeclaration(lastNode) && lastNode.declarations.length == 1 && lastNode.declarations[0].id.name == switchNode.discriminant.name) {
                let indexname = lastNode.declarations[0].id.name,
                    index = lastNode.declarations[0].init.value;
                //获取所得到的列表之后删除上一级节点
                path.getPrevSibling().remove()
                //获取switch中的cases列表
                let cases = path.node.body.body[0].cases;
                let control = true;
                let breakmakes = true;
                while (control) {

                    for (i in cases) {
                        //判断case的test的值是否等于index
                        if (index == cases[i].test.value) {
                            let consequ = cases[i].consequent;

                            for (number in consequ) {
                                //判断什么节点需要加入

                                if (!types.isBreakStatement(consequ[number])) {
                                    //如果不是break进入
                                    if (types.isExpressionStatement(consequ[number]) && types.isAssignmentExpression(consequ[number].expression) && consequ[number].expression.left.name == indexname) {
                                        if (!breakmakes) {
                                            index = index - 1

                                        }
                                        switch (consequ[number].expression.operator) {
                                            case "+=":
                                                index += consequ[number].expression.right.value;

                                                break;
                                            case "-=":
                                                index -= consequ[number].expression.right.value;

                                                break;
                                        }

                                    } else if (types.isReturnStatement(consequ[number])) {
                                        res_path = res_path.concat(consequ[number])
                                        //control设为false结束循环
                                        control = false;
                                    } else {
                                        res_path = res_path.concat(consequ[number])
                                    }
                                }
                            }
                            if (!types.isBreakStatement(cases[i].consequent[cases[i].consequent.length - 1])) {
                                breakmakes = false;
                                index += 1
                            } else {
                                breakmakes = true;
                            }
                            break;
                        }

                    }
                }
                path.replaceWithMultiple(res_path);
            }
        }


    }
});
console.log("1-->解前一部分控制流完成")
//换掉前面定义的原型方法
// Array["prototype"]["j"] = Array["prototype"]["join"];
// Array["prototype"]["p"] = Array["prototype"]["push"];
// String["prototype"]["d"] = String["prototype"]["charCodeAt"];
// String["prototype"]["c"] = String["prototype"]["charAt"];

//p.p ==> p.push

//调用所有的call方法，如果属性为p,或者是j  并且调用者类型是arr类型  就替换
//获取原有的的属性
//应直接修改为一一对应

traverse(ast, {
    CallExpression(path) {
        const {
            callee
        } = path.node;
        if (callee.property != undefined && callee.property.name === "p") {
            callee.property.name = "push"
        } else if (callee.property != undefined && callee.property.name === "j") {
            callee.property.name = "join"
        } else if (callee.property != undefined && callee.property.name === "d") {
            callee.property.name = "charCodeAt"
        } else if (callee.property != undefined && callee.property.name === "c") {
            callee.property.name = "charAt"
        } else if (callee.name == "$") {
            callee.name = "String.fromCharCode";
        }
    }
})
console.log("2-->还原原型方法完成")
//有一些方法可以直接运行，找到这些方法  并将方法名称和value进行映射
//创建一个新的ast
let newAst = parser.parse("") //深拷贝
//将原本的ast的所有节点添加进去  但是不需要自执行
newAst.program.body = ast.program.body[0].expression.callee.body.body.slice(0, ast.program.body[0].expression.callee.body.body.length);
//将新的ast转换为代码
let newcode = generator(newAst).code

eval("window=this;;" + newcode)

//遍历所有的函数定义，如果函数没有参数 就直接运行;
//创建一个对象进行映射
let funcDict = {}
traverse(ast, {
    FunctionDeclaration(path) {
        if (path.node.id != undefined && path.node.params.length == 0) {

            try {
                if (eval(path.node.id.name + "()") && eval(path.node.id.name + "()") != undefined) {
                    funcDict[path.node.id.name] = eval(path.node.id.name + "()")
                    path.remove()
                }

            } catch {}
        }
    }
})


//获取所有调用的方法
traverse(ast, {
    CallExpression(path) {
        if (path.node.callee != undefined && path.node.arguments != undefined && path.node.arguments.length == 0 && funcDict[path.node.callee.name] != undefined) {
            path.replaceWith(types.valueToNode(funcDict[path.node.callee.name]))

        }
    }
})
console.log("3-->还原可以被直接执行的方法完成")


//获取所有调用最后一个解密方法
//解密方法根据传入值的不同  会执行不同分支，如果是一个参数就是返回解密的字符串，如果不是需要再创建一个最后一个解密的函数
//遍历所有的CallExpression


let newA = parser.parse("")
traverse(ast, {
    CallExpression(path) {
        const {
            callee,
            argument
        } = path.node;
        try {
            if (callee != undefined && callee.name != undefined && callee.name === decodeName) {
                if (eval(path.toString()) !== undefined && eval(path.toString()) != "") {

                    path.replaceWith(types.valueToNode(eval(path.toString())));
                } else {
                    throw new Error;
                }
            }
        } catch {
                path.node.arguments[0] = types.valueToNode(eval(generator(path.node.arguments[0]).code));
                let  newname = decodeAstNode.id.name + eval(generator(path.node.arguments[0]).code);
                //深拷贝
                let newDecodAstNode = parser.parse(generator(decodeAstNode).code).program.body[0];
                newDecodAstNode.id.name = newname;
                //替换原有的调用名称
                callee.name = newname;
                ast.program.body[0].expression.callee.body.body.push(newDecodAstNode);
        }

    }
})
console.log("4-->生成新的解密方法完成")

ast = reload(ast);
traverse(ast, {
    CallExpression(path) {
        const {
            callee,
            argument
        } = path.node;
        try {
            if (callee != undefined && callee.name != undefined && callee.name === decodeName) {
                if (eval(path.toString()) !== undefined && eval(path.toString()) != "") {

                    path.replaceWith(types.valueToNode(eval(path.toString())));
                } else {
                    throw new Error;
                }
            }
        } catch {
                path.node.arguments[0] = types.valueToNode(eval(generator(path.node.arguments[0]).code));
                let  newname = decodeAstNode.id.name + eval(generator(path.node.arguments[0]).code);
               
                //替换原有的调用名称
                callee.name = newname;
                
                
        }

    }
})
console.log("5-->对所有新的解密方法里的调用方法再次还原")


ast = reload(ast);
//删除原有的解密方法
traverse(ast,{
    FunctionDeclaration(path){
        if(path.node.id.name == decodeName){
            path.remove()
        }
    }
})
console.log("6-->删除原有解密方法完成")


ast = reload(ast);


// 再次对增加的方法的控制流进行解混淆
// 再次对增加的方法的控制流进行解混淆
traverse(ast,{
    WhileStatement(path){
      if(types.isFunctionDeclaration(path.getPrevSibling().parentPath.parentPath.node) && path.node.test.operator === "!"){
        let index = parseInt(path.getPrevSibling().parentPath.parentPath.node.id.name.replace(decodeName,""))
    
        let indexname = path.node.body.body[0].discriminant.name

        //创建一个空的节点数组
        let res_path = [];
        //获取cases的列表
        cases_list = path.node.body.body[0].cases;
        //创建一个case索引
        let caseindex = index
        //创建一个控制循环的
        control = true;
        let breakmakes = false
        while(control){
          for(c in cases_list){
            if(cases_list[c].test != undefined && cases_list[c].test.value == caseindex){
              
              control = true
              //如果匹配到index的值
              
              consequent_list = cases_list[c].consequent

              for(c_index in consequent_list){
                if(!types.isContinueStatement(consequent_list[c_index])){
                  if(types.isExpressionStatement(consequent_list[c_index]) && consequent_list[c_index].expression.left != undefined && consequent_list[c_index].expression.left.name == indexname){
                    
                    switch (consequent_list[c_index].expression.operator) {
                      case "+=":
                        index += consequent_list[c_index].expression.right.value;
                        break;
                      case "-=":
                        index -= consequent_list[c_index].expression.right.value;
                        break;
                    }
                  }else if(types.isReturnStatement(consequent_list[c_index])){

                        res_path = res_path.concat(consequent_list[c_index])
                        control = false;
                  }else if(consequent_list[c_index].toString()=="function join() { [native code] }" || consequent_list[c_index].toString()=="function push() { [native code] }"){
                            continue;

                  }else{
                       
                        res_path = res_path.concat(consequent_list[c_index])
                  }
                  
                }
              }
              //判断语句是否为countinui结尾
                if(!types.isContinueStatement(cases_list[c].consequent[cases_list[c].consequent.length-1])){
                      breakmakes = false;
                  
                      caseindex += 1
                  } else {
                     
                      caseindex = index
                  }
            break;
            }
            
            control = false
          }
        }

        path.replaceWithMultiple(res_path);

      }
    }
  })
console.log("对新增加的方法解控制流完成")


traverse(ast,{
    AssignmentExpression(path){
        if(path.scope.bindings[path.node.left.name] != undefined){
          if(path.scope.bindings[path.node.left.name].references == 0){
            path.remove()
          }
        }
    }
})




function getArr(elements) {
    let arr = [];

    for (elem in elements) {
        arr.push(elements[elem].value)
    }
    return arr;

}

//生成不替换文件  代码是不压缩的
var code = generator(ast, {
    compact: false, // 压缩格式
    comments: false, // 注释
    jsescOption: {
        "minimal": true // 转义
        }
    }).code;
fs.writeFile(decode_file, code, (err) => {});








