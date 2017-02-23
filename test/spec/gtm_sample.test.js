import assert from 'assert';
import uuid from 'uuid';
import * as ga from '../../lib/ga';
import {getHitLogs} from '../../lib/server';
import config from '../../config';
import minimist from 'minimist';

let testId; 

describe('GTM Sample', () => {
  before(function(done) {
    this.timeout(30000);
    if (process.env.GTM_PREVIEW) {
      browser.get(process.env.GTM_PREVIEW).then(done);
    } else {
      done();
    }
  });
  beforeEach(function(done) {
    this.timeout(30000);
    testId = uuid();
    browser.get(`${config.baseUrl}/gtm.html`)
      .then(() => { browser.executeScript(ga.hideGtmConsole); })
      .then(() => { browser.executeScript(ga.spy); })
      .then(() => { browser.executeScript(ga.spyCaptureLog, testId); })
      .then(done);
  });
  it('Title', (done) => {
    browser.getTitle()
      .then((title) => {
        assert.equal(title, 'GTM Sample');
      })
      .then(done);
  });
  it('Outbound Link', (done) => {
    return element(by.css('#link')).click()
      .then(() => {
        const hits = getHitLogs(testId);
        assert.equal(hits.length, 1);
        assert.strictEqual(hits[0].ec, 'Outbound Link');
        assert.strictEqual(hits[0].ea, 'Click');
        assert.strictEqual(hits[0].el, 'https://www.google.co.jp/');
      })
      .then(done);
  });
  it('trackers count', (done) => {
    return element(by.css('#link')).click()
      .then(() => element(by.css('#link')).click())
      .then(() => element(by.css('#link')).click())
      .then(() => browser.executeScript(ga.trackers))
      .then((trackers) => {
        assert.equal(4, trackers.length);
      })
      .then(done);
  });
});
