# GAImpleSpec
## Overview
Implementing the Google Analytics tracking code can result in 100+ lines of code. In addition, this code is changed every day as site improvement and analysis items change. As the number of changes increases, the possibility that an error will occur in the measurement content increases.

This program ins for executing automatic test of the Google Analytics tracking code.

## Requirements
- [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)

## Installation
```
$ git clone git@github.com:1987yama3/ga-automate-test.git
$ npm install
$ npm install -g gulp
$ cp config.sample.json config.json
$ vi config.json # edit accoding to your own environment. 
$ gulp init
```

## Run
```
$ gulp test
```

or

```
$ gulp test --file test/spec/sample.test.js
```

### Parameters

| Parameter | Description |
|:----------|:------------|
| --file filepath | Run test only for the specified file |
| --gtm_preview preview_url | It is an option when using debug mode of Google Tag Manager. Specify the link for preview shareing. |

## Spec Examples
```js
import assert from 'assert';
import uuid from 'uuid';
import * as ga from '../../lib/ga';
import {getHitLogs} from '../../lib/server';
import config from '../../config';

let testId;
describe('http://localhost:8888/index.html', () => {
  beforeEach(function(done) {
    this.timeout(20000);
    testId = uuid();
    browser.get('http://localhost:8888/index.html')
      .then(() => { browser.executeScript(ga.run, 'create', 'UA-xxxxxxx-y', 'auto'); })
      .then(() => { browser.executeScript(ga.captureLog, testId); })
      .then(done);
  });

  it('Outbound Link', (done) => {
    element(by.css('#link')).click()
      .then(() => {
        const hits = getHitLogs(testId);
        assert.equal(hits.length, 1);
        assert.strictEqual(hits[0].ec, 'Outbound Link');
        assert.strictEqual(hits[0].ea, 'Click');
        assert.strictEqual(hits[0].el, 'https://www.google.co.jp/');
      })
      .then(done);
  });
});
```

## Technology
- [Protractor](http://www.protractortest.org/)
- [ga-spy](https://github.com/smhmic/ga-spy)

## Contributors
- ryota yamada, [1987yama3@gmail.com](mailto:1987yama3@gmail.com)


