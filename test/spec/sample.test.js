import assert from 'assert';
import uuid from 'uuid';
import * as ga from '../../lib/ga';
import {getHitLogs} from '../../lib/server';
import config from '../../config';

let testId; 

describe('Sample', () => {
  beforeEach(function(done) {
    this.timeout(30000);
    testId = uuid();
    browser.get(`${config.baseUrl}/index.html`)
      .then(() => { browser.executeScript(ga.run, 'create', config.trackingId, 'auto'); })
      .then(() => { browser.executeScript(ga.captureLog, testId); })
      .then(done);
  });
  it('Title', (done) => {
    browser.getTitle()
      .then((title) => {
        assert.equal(title, 'Sample');
      })
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
