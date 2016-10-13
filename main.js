var esprima = require("esprima");
var options = { tokens: true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main() {
  var args = process.argv.slice(2);

  if (args.length == 0) {
    args = ["subject.js"];
  }
  var filePath = args[0];

  constraints(filePath);

  generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue(greaterThan, constraintValue) {
  if (greaterThan)
    return Random.integer(constraintValue, constraintValue + 10)(engine);
  else
    return Random.integer(constraintValue - 10, constraintValue)(engine);
}

function Constraint(properties) {
  this.ident = properties.ident;
  this.expression = properties.expression;
  this.operator = properties.operator;
  this.value = properties.value;
  this.funcName = properties.funcName;
  // Supported kinds: "fileWithContent","fileExists"
  // integer, string, phoneNumber
  this.kind = properties.kind;
}

function fakeDemo() {
  console.log(faker.phone.phoneNumber());
  console.log(faker.phone.phoneNumberFormat());
  console.log(faker.phone.phoneFormats());
}

var functionConstraints = {}

var mockFileLibrary = {
  pathExists: {},
  fileWithContent: {}
};

var insaneCount = 0;

function generateTestCases() {

  var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
  for (var funcName in functionConstraints) {
    var params = {};

    // initialize params
    for (var i = 0; i < functionConstraints[funcName].params.length; i++) {
      var paramName = functionConstraints[funcName].params[i];
      //params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
      params[paramName] = [];
    }

    // update parameter values based on known constraints.
    var constraints = functionConstraints[funcName].constraints;

    // Handle global constraints...
    var fileWithContent = _.some(constraints, { kind: 'fileWithContent' });
    var pathExists = _.some(constraints, { kind: 'fileExists' });

    // plug-in values for parameters
    for (var c = 0; c < constraints.length; c++) {
      var constraint = constraints[c];
      if (params.hasOwnProperty(constraint.ident)) {
        params[constraint.ident].push(constraint.value);
      }
    }

    // Prepare function arguments.
    var args = Object.keys(params).map(function(k) {
      return params[k];
    });

    args = allPossibleCases(args);

    if (pathExists || fileWithContent) {
      for (var argCombination of args) {
        content += generateMockFsTestCases(pathExists, fileWithContent, funcName, argCombination);
        content += generateMockFsTestCases(!pathExists, fileWithContent, funcName, argCombination);
        content += generateMockFsTestCases(pathExists, !fileWithContent, funcName, argCombination);
        content += generateMockFsTestCases(!pathExists, !fileWithContent, funcName, argCombination);
      }
    } else {
      if (args.length == 0) {
        var args = Object.keys(params).map(function(k) {
          return '"aaa"';
        });
        content += "subject.{0}({1});\n".format(funcName, args);
      } else {
        for (var argCombination of args) {
          content += "subject.{0}({1});\n".format(funcName, argCombination);
        }
      }
    }

  }

  fs.writeFileSync('test.js', content, "utf8");
}

function allPossibleCases(arr) {
  if (arr.length == 1) {
    return arr[0];
  } else {
    var result = [];
    var allCasesOfRest = allPossibleCases(arr.slice(1));
    for (var i = 0; i < allCasesOfRest.length; i++) {
      for (var j = 0; j < arr[0].length; j++) {
        var temp = [];
        temp.push(arr[0][j]);
        temp.push(allCasesOfRest[i]);
        result.push(temp);
      }
    }
    result = flattenInnerLevelOfResult(result);
    return result;
  }
}

function flattenInnerLevelOfResult(arr) {
  var result = [];
  for (var innerArr of arr) {
    var temp = [];
    for (var element of innerArr) {
      if (Array.isArray(element)) {
        temp = temp.concat(element);
      } else {
        temp.push(element);
      }
    }
    result.push(temp);
  }
  return result;
}

function generateMockFsTestCases(pathExists, fileWithContent, funcName, args) {
  var testCase = "";
  // Build mock file system based on constraints.
  var mergedFS = {};
  if (pathExists) {
    for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
  }
  if (fileWithContent) {
    for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
  }

  testCase +=
    "mock(" +
    JSON.stringify(mergedFS) +
    ");\n";

  testCase += "\tsubject.{0}({1});\n".format(funcName, args);
  testCase += "mock.restore();\n";
  return testCase;
}

function constraints(filePath) {
  var buf = fs.readFileSync(filePath, "utf8");
  var result = esprima.parse(buf, options);

  traverse(result, function(node) {
    if (node.type === 'FunctionDeclaration') {
      var funcName = functionName(node);
      console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName));

      var params = node.params.map(function(p) {
        return p.name
      });

      var dependencies = {};

      for (var param of params) {
        dependencies[param] = [];
      }

      functionConstraints[funcName] = { constraints: [], params: params };

      // Check for expressions using argument.
      traverse(node, function(child) {
        if (child.type == 'VariableDeclaration') {
          for (var param in dependencies) {
            var toSearch = '"name":' + '"' + param + '"';
            var present = JSON.stringify(child.declarations[0].init).indexOf(toSearch);
            if (present > -1) {
              dependencies[param].push(child.declarations[0].id.name);
              continue;
            }
            for (var dependency of dependencies[param]) {
              var toSearch = '"name":' + '"' + dependency + '"';
              var present = JSON.stringify(child.declarations[0].init).indexOf(toSearch);
              if (present > -1) {
                dependencies[param].push(child.declarations[0].id.name);
                break;
              }
            }
          }
        }
        if (child.type === 'BinaryExpression' && (child.operator == "==" || child.operator == "!=" || child.operator == ">" || child.operator == "<" || child.operator == ">=" || child.operator == "<=")) {
          for (var param in dependencies) {
            if (child.left.type == 'Identifier' && dependencies[param].indexOf(child.left.name) > -1) {
              var rightHand = buf.substring(child.right.range[0], child.right.range[1]);

              switch (child.operator) {
                case '==':
                case '!=':
                  functionConstraints[funcName].constraints.push(
                    new Constraint({
                      ident: param,
                      value: rightHand,
                      funcName: funcName,
                      kind: "integer",
                      operator: child.operator,
                      expression: expression
                    }));
                  functionConstraints[funcName].constraints.push(
                    new Constraint({
                      ident: param,
                      value: '"1' + rightHand.replace(/['"]+/g, '') + '"',
                      funcName: funcName,
                      kind: "string",
                      operator: child.operator,
                      expression: expression
                    }));
              }
            }
          }
          if (child.left.type == 'Identifier' && params.indexOf(child.left.name) > -1) {
            // get expression from original source code:
            var expression = buf.substring(child.range[0], child.range[1]);
            var rightHand = buf.substring(child.right.range[0], child.right.range[1])

            switch (child.operator) {
              case '==':
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: rightHand,
                    funcName: funcName,
                    kind: "integer",
                    operator: child.operator,
                    expression: expression
                  }));
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: '"' + rightHand.replace(/['"]+/g, '') + 'a"',
                    funcName: funcName,
                    kind: "string",
                    operator: child.operator,
                    expression: expression
                  }));
                break;
              case '!=':
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: rightHand,
                    funcName: funcName,
                    kind: "integer",
                    operator: child.operator,
                    expression: expression
                  }));
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: '"' + rightHand.replace(/['"]+/g, '') + 'a"',
                    funcName: funcName,
                    kind: "string",
                    operator: child.operator,
                    expression: expression
                  }));
                break;
              case '<':
              case '<=':
              case '>':
              case '>=':
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) + 1,
                    funcName: funcName,
                    kind: "integer",
                    operator: child.operator,
                    expression: expression
                  }));
                functionConstraints[funcName].constraints.push(
                  new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) - 1,
                    funcName: funcName,
                    kind: "integer",
                    operator: child.operator,
                    expression: expression
                  }));
                break;
            }
          } else if (child.left.type == "CallExpression" && child.left.callee.type == "MemberExpression" && params.indexOf(child.left.callee.object.name) > -1) {
            if (child.left.callee.property.name == "indexOf") {
              var variableName = child.left.callee.object.name;
              var value = child.left.arguments[0].value;
              var expression = buf.substring(child.range[0], child.range[1]);
              var rightHand = parseInt(buf.substring(child.right.range[0], child.right.range[1]));

              switch (child.operator) {
                case '==':
                  var temp = "";
                  for (var i = 1; i <= rightHand; i++)
                    temp += "a";
                  var temp1 = '"' + temp + value + '"';
                  var temp2 = '"a' + temp + value + '"';
                  functionConstraints[funcName].constraints.push(
                    new Constraint({
                      ident: variableName,
                      value: temp1,
                      funcName: funcName,
                      kind: "string",
                      operator: child.operator,
                      expression: expression
                    }));
                  functionConstraints[funcName].constraints.push(
                    new Constraint({
                      ident: variableName,
                      value: temp2,
                      funcName: funcName,
                      kind: "string",
                      operator: child.operator,
                      expression: expression
                    }));
                  break;
                case '<':
                case '<=':
                case '>':
                case '>=':
                  break;
              }
            }
          }

        }

        if (child.type == "CallExpression" &&
          child.callee.property &&
          child.callee.property.name == "readFileSync") {
          for (var p = 0; p < params.length; p++) {
            if (child.arguments[0].name == params[p]) {
              var pathName = "path" + insaneCount++;
              var fileName = "file" + insaneCount++;
              mockFileLibrary.fileWithContent[pathName] = {};
              mockFileLibrary.fileWithContent[pathName][fileName] = "dummy content";
              functionConstraints[funcName].constraints.push(
                new Constraint({
                  ident: params[p],
                  value: "'" + pathName + "/" + fileName + "'",
                  funcName: funcName,
                  kind: "fileWithContent",
                  operator: child.operator,
                  expression: expression
                }));
              pathName = "path" + insaneCount++;
              fileName = "file" + insaneCount++;
              mockFileLibrary.fileWithContent[pathName] = {};
              mockFileLibrary.fileWithContent[pathName][fileName] = "";
              functionConstraints[funcName].constraints.push(
                new Constraint({
                  ident: params[p],
                  value: "'" + pathName + "/" + fileName + "'",
                  funcName: funcName,
                  kind: "fileWithContent",
                  operator: child.operator,
                  expression: expression
                }));
            }
          }
        }

        if (child.type == "CallExpression" &&
          child.callee.property &&
          child.callee.property.name == "readdirSync") {
          for (var p = 0; p < params.length; p++) {
            if (child.arguments[0].name == params[p]) {
              var pathName = "path" + insaneCount++;
              var fileName = "file" + insaneCount++;
              mockFileLibrary.pathExists[pathName] = {};
              mockFileLibrary.pathExists[pathName][fileName] = "dummy content";
              functionConstraints[funcName].constraints.push(
                new Constraint({
                  ident: params[p],
                  value: "'" + pathName + "'",
                  funcName: funcName,
                  kind: "fileExists",
                  operator: child.operator,
                  expression: expression
                }));
              pathName = "path" + insaneCount++;
              var dirName = "dir" + insaneCount++;
              var fullPath = pathName + "/" + dirName;
              mockFileLibrary.pathExists[fullPath] = {};
              fullPath = "'" + fullPath + "'";
              functionConstraints[funcName].constraints.push(
                new Constraint({
                  ident: params[p],
                  // A fake path to a file
                  value: fullPath,
                  funcName: funcName,
                  kind: "fileExists",
                  operator: child.operator,
                  expression: expression
                }));
            }
          }
        }

        // if (child.type == "CallExpression" &&
        //   child.callee.property &&
        //   child.callee.property.name == "existsSync") {
        //   for (var p = 0; p < params.length; p++) {
        //     if (child.arguments[0].name == params[p]) {
        //       var pathName = "path" + insaneCount++;
        //       var dirName = "dir" + insaneCount++;
        //       var fullPath = pathName + "/" + dirName;
        //       mockFileLibrary.pathExists[fullPath] = {};
        //       fullPath = "'" + fullPath + "'";
        //       functionConstraints[funcName].constraints.push(
        //         new Constraint({
        //           ident: params[p],
        //           // A fake path to a file
        //           value: fullPath,
        //           funcName: funcName,
        //           kind: "fileExists",
        //           operator: child.operator,
        //           expression: expression
        //         }));
        //     }
        //   }
        // }

      });

      console.log(functionConstraints[funcName]);

    }
  });
}

function traverse(object, visitor) {
  var key, child;

  visitor.call(null, object);
  for (key in object) {
    if (object.hasOwnProperty(key)) {
      child = object[key];
      if (typeof child === 'object' && child !== null) {
        traverse(child, visitor);
      }
    }
  }
}

function traverseWithCancel(object, visitor) {
  var key, child;

  if (visitor.call(null, object)) {
    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key];
        if (typeof child === 'object' && child !== null) {
          traverseWithCancel(child, visitor);
        }
      }
    }
  }
}

function functionName(node) {
  if (node.id) {
    return node.id.name;
  }
  return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

main();
