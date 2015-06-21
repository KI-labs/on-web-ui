'use strict';
/* global gulp, path */

import conflict from 'gulp-conflict';
import template from 'gulp-template';
import inquirer from 'inquirer';

var src = path.join(__dirname, '..', '..', 'templates', 'app', '**');

var target = path.join(__dirname, '..', '..', 'apps', 'test');

gulp.task('app', function (done) {
  inquirer.prompt([
    {type: 'input', name: 'name', message: 'Give your app a name', default: gulp.args.join(' ')}, // Get app name from arguments by default
    {type: 'confirm', name: 'moveon', message: 'Continue?'}
  ],
  function (answers) {
    if (!answers.moveon) {
      return done();
    }
    gulp.src(src)  // Note use of __dirname to be relative to generator
      .pipe(template(answers))                 // Lodash template support
      .pipe(conflict(target))                    // Confirms overwrites on file conflicts
      .pipe(gulp.dest(target))                   // Without __dirname here = relative to cwd
      .on('end', function () {
        done();                                // Finished!
      })
      .resume();
  });
});
