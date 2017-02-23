exports.config = {
  seleniumServerJar: './node_modules/gulp-protractor/node_modules/protractor/node_modules/webdriver-manager/selenium/selenium-server-standalone-2.53.1.jar',
  framework: 'mocha',
  mochaOpts: {
    reporter: 'spec',
  },
  multiCapabilities: [
    { browserName: 'chrome' },
  ],
  directConnect: true,
  onPrepare: () => {
    require("babel-register");
    browser.ignoreSynchronization = true;
  },
};
