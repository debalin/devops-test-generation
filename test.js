var subject = require('./subject.js')
var mock = require('mock-fs');
subject.inc(1,undefined);
subject.inc(-1,undefined);
subject.inc(1,"undefineda");
subject.inc(-1,"undefineda");
subject.weird(8,1,43,"strict");
subject.weird(6,1,43,"strict");
subject.weird(8,-1,43,"strict");
subject.weird(6,-1,43,"strict");
subject.weird(8,1,41,"strict");
subject.weird(6,1,41,"strict");
subject.weird(8,-1,41,"strict");
subject.weird(6,-1,41,"strict");
subject.weird(8,1,43,"stricta");
subject.weird(6,1,43,"stricta");
subject.weird(8,-1,43,"stricta");
subject.weird(6,-1,43,"stricta");
subject.weird(8,1,41,"stricta");
subject.weird(6,1,41,"stricta");
subject.weird(8,-1,41,"stricta");
subject.weird(6,-1,41,"stricta");
subject.weird(8,1,43,"werw");
subject.weird(6,1,43,"werw");
subject.weird(8,-1,43,"werw");
subject.weird(6,-1,43,"werw");
subject.weird(8,1,41,"werw");
subject.weird(6,1,41,"werw");
subject.weird(8,-1,41,"werw");
subject.weird(6,-1,41,"werw");
subject.weird(8,1,43,"awerw");
subject.weird(6,1,43,"awerw");
subject.weird(8,-1,43,"awerw");
subject.weird(6,-1,43,"awerw");
subject.weird(8,1,41,"awerw");
subject.weird(6,1,41,"awerw");
subject.weird(8,-1,41,"awerw");
subject.weird(6,-1,41,"awerw");
subject.weird(8,1,43,"strict");
subject.weird(6,1,43,"strict");
subject.weird(8,-1,43,"strict");
subject.weird(6,-1,43,"strict");
subject.weird(8,1,41,"strict");
subject.weird(6,1,41,"strict");
subject.weird(8,-1,41,"strict");
subject.weird(6,-1,41,"strict");
subject.weird(8,1,43,"stricta");
subject.weird(6,1,43,"stricta");
subject.weird(8,-1,43,"stricta");
subject.weird(6,-1,43,"stricta");
subject.weird(8,1,41,"stricta");
subject.weird(6,1,41,"stricta");
subject.weird(8,-1,41,"stricta");
subject.weird(6,-1,41,"stricta");
mock({"path0":{"file1":"dummy content"},"path2/dir3":{},"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path0','path4/file5');
mock.restore();
mock({"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path0','path4/file5');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{}});
	subject.fileTest('path0','path4/file5');
mock.restore();
mock({});
	subject.fileTest('path0','path4/file5');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{},"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path2/dir3','path4/file5');
mock.restore();
mock({"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path2/dir3','path4/file5');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{}});
	subject.fileTest('path2/dir3','path4/file5');
mock.restore();
mock({});
	subject.fileTest('path2/dir3','path4/file5');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{},"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path0','path6/file7');
mock.restore();
mock({"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path0','path6/file7');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{}});
	subject.fileTest('path0','path6/file7');
mock.restore();
mock({});
	subject.fileTest('path0','path6/file7');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{},"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path2/dir3','path6/file7');
mock.restore();
mock({"path4":{"file5":"dummy content"},"path6":{"file7":""}});
	subject.fileTest('path2/dir3','path6/file7');
mock.restore();
mock({"path0":{"file1":"dummy content"},"path2/dir3":{}});
	subject.fileTest('path2/dir3','path6/file7');
mock.restore();
mock({});
	subject.fileTest('path2/dir3','path6/file7');
mock.restore();
subject.normalize("aaa");
subject.format("aaa","aaa","aaa");
subject.blackListNumber("212");
subject.blackListNumber("1212");
