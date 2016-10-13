# DevOps Test Generation

This repository holds the second homework for the DevOps course. It builds up on the code that Dr. Parnin had provided [here](https://github.com/CSC-DevOps/TestGeneration). The homework specification can be found [here](https://github.com/CSC-DevOps/Course/blob/master/HW/HW2.md). I will first introduce the goal in brief and then describe my techniques in the following sections, ending with screenshots of my coverage report generated using `Istanbul`.

### Goal 

The goal is to automatically create a test file in `Node.js` based on an input `.js` file. It does not need to exhaustive for any JavaScript file, but should take care of the branch and statement coverages for the files provided. These include conditional value checking for function parameters, file system based conditionals (achieved using `mock-fs`) and conditional statements which are indirectly related to function parameters. 

### Steps to run my program

1. Clone my repository.
2. Install `Node.js` if you don't already have it. 
3. Run `npm install` on the root directory. 
4. Run `node main.js` to create the `test.js` file which is basically the file used to test either `subject.js` or `mystery.js`. 
5. Run `node_modules\.bin\istanbul cover test.js` to check the coverage. 
6. Run `start coverage/lcov-report/TestGeneration/subject.js.html` (for Windows) to check the code coverage results. 
7. To change from `subject.js` to `mystery.js`, you have to change that in two places in the code - line 14 and line 61. 

### Techniques

1. **Direct conditional value checking**: This case corresponds to the situation where you have the function parameters in the conditional statements itself. This was already implemented in the base code up to a certain level. I introduced more constraints by checking for more signs and then pushing two values in the constraint array for each case - one which is lesser than the checked value and one which is larger, thus hoping to cover both the if and else statments of the conditional check. Afterwards, for each function, a power set (influenced from [here](http://codereview.stackexchange.com/questions/52119/calculate-all-possible-combinations-of-an-array-of-arrays-or-strings)) is formed for the arguments and all of them are written to the test file.

2. **File system checks**: I have modified the `mockFileLibrary` to remove every hardocded thing from there (from the base code). Instead now, when I see `readFileSync` or `readdirSync`, I create two new constraints AS WELL AS two new entries in the `mockFileLibrary`, i.e. the latter is dynamically created based on how many `readFileSync`s or `readdirSync`s are there. `existSync` check is not needed any more and so I have commented it out. 

3. **Indirect conditional value checking**: This happens for the last function where the value that is being checked in a conditional statement is actually NOT a function parameter. In that case, I create a dependency list noting which variables are dependent on the function parameters. For example, in the `blackListNumber` function, `num` depends on `phoneNumber` (which is a function parameter) and `area` depends on `num`. Thus my dependency list will say that `num` and `area` both depend on `phoneNumber`. Consequently, I create a function constraint based on the right hand value of the dependent variable in the conditional statement. Ideally, I should check how the dependeny is working, but that I'd assume is beyond the current scope. For our test cases, this much genericity would be fine. 

4. **No constraints**: For cases, where no contraints could be generated, I check the number of parameters and write the function calls in the `test.js` with dummy strings as parameters. 

### Screenshots

![subject.js coverage](http://i.imgur.com/bOZq3PQ.png "subject.js coverage")

![mystery.js coverage](http://i.imgur.com/VsjZEQZ.png "mystery.js coverage")
