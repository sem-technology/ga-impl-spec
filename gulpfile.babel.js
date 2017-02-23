import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import {protractor} from 'gulp-protractor';
import download from 'gulp-download';
import runSequence from 'run-sequence';
import minimist from 'minimist';

import * as server from './lib/server';
import config from './config';

let seleniumServer;

gulp.task('init', (done) => {
  runSequence('analytics:update', done);
});

gulp.task('eslint', () => {
  return gulp.src([
    './lib/**/*.js'
  ])
  .pipe(eslint({
    useEslintrc: true
  }))  
  .pipe(eslint.format());
});

gulp.task('analytics:update', (done) => {
  return download('https://www.google-analytics.com/analytics.js')
    .pipe(gulp.dest('./test/www/'));
});

gulp.task('test:server:start', (done) => {
  server.start({
    port: config.port,
    static_path: config.static_path
  }, done);
  process.on('exit', server.stop.bind(server));
});

gulp.task('test:server:stop', (done) => {
  server.stop();
  done();
});

gulp.task('test:protractor', () => {
  const argv = minimist(process.argv.slice(2));
  const file = argv.file || './test/spec/**/*.test.js';
  if (argv.gtm_preview) {
    process.env.GTM_PREVIEW = argv.gtm_preview;
  }
  return gulp.src([file])
    .pipe(babel())
    .pipe(protractor({
      configFile: './protractor.conf.js',
    }))
    .on('error', (e) => { throw e; });
});

gulp.task('test', (done) => {
  runSequence('test:server:start', 'test:protractor', 'test:server:stop', done);
});  

