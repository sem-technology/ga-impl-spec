import express from 'express';
import serveStatic from 'serve-static';
import fs from 'fs-extra';
import qs from 'querystring';
import url from 'url';
import path from 'path';

let server = undefined;
const LOG_PATH = './test/logs/';

export const start = (config, done) => {
  const app = express();
  app.use(serveStatic(config.static_path));
  app.get('/collect/:testId', (req, res) => {
    const payload = url.parse(req.url).query;
    logPayload(payload);
    const logFile = getLogFile(req.params.testId);
    fs.ensureDirSync(LOG_PATH);
    fs.appendFileSync(logFile, payload + '\n');
    res.end();
  });
  app.post('/collect/:testId', (req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk))
      .on('end', () => {
        const payload = Buffer.concat(chunks).toString();
        logPayload(payload);
        const logFile = getLogFile(req.params.testId);
        fs.ensureDirSync(LOG_PATH);
        fs.appendFileSync(logFile, payload + '\n');
        res.end();
      });
  });
  server = app.listen(config.port, done);
};

export const stop = () => {
  if (server) {
    server.close();
    server = undefined;
  }
};

export const getLogFile = (testId) => {
  return path.join(LOG_PATH, testId + '.log');
};

export const getHitLogs = (testId) => {
  const logFile = getLogFile(testId);
  if (fs.existsSync(logFile)) {
    let contents;
    try {
      contents = fs.readFileSync(logFile, 'utf-8');
    } catch(e) {
      process.stderr.write(e + '\n');
    }
    return contents.trim().split('\n')
      .map( (hit) => qs.parse(hit) )
      .sort( (a, b) => Number(a.time) - Number(b.time) );
  } else {
    return [];
  }
};

const logPayload = (payload) => {
  const paramsToIgnore = ['v', 'did', 'tid', 'a', 'z', 'ul',
        'de', 'sd', 'sr', 'vp', 'je', 'fl', 'jid'];
  const hit = qs.parse(payload);
  Object.keys(hit).forEach((key) => {
    if (!(key.charAt(0) === '_' || paramsToIgnore.includes(key))) {
      // process.stdout.write('  ' + key + ': ' + hit[key] + '\n');
    }
  });
};
