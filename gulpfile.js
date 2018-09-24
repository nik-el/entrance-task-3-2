'use strict';

const gulp = require('gulp');
const mocha = require('gulp-mocha');

gulp.task('test', function () {
  return gulp
    .src(['js/**/*.test.js'], { read: false })
    .pipe(mocha({
      ui: 'tdd',
      require: ['babel-register'],
      reporter: 'dot'
    }));
});