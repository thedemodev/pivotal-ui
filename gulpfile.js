var argv = require('yargs').argv,
  browserify = require('browserify'),
  compass = require('gulp-compass'),
  connect = require('gulp-connect'),
  del = require('del'),
  ejs = require('gulp-ejs'),
  errorHandler = require('./tasks/errorHandler.js'),
  fs = require('fs'),
  gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  open = require('gulp-open'),
  reactify = require('reactify'),
  rename = require('gulp-rename'),
  replace = require('gulp-replace'),
  shell = require('gulp-shell'),
  source = require('vinyl-source-stream'),
  stylish = require('jshint-stylish'),
  jsxTransform = require('gulp-react');

require('./tasks/test.js');
require('./tasks/release.js');

gulp.task('default', [
  'watch',
  'serve'
]);

gulp.task('watch', ['assets'], function() {
  gulp.watch(['src/pivotal-ui/components/**/*.scss', 'src/pivotal-ui/pivotal-ui.scss'], ['_puiScss']);
  gulp.watch(['src/pivotal-ui/javascripts/**/*.js', 'src/pivotal-ui/javascripts/**/*.jsx'], ['_puiJs']);
  gulp.watch(['src/styleguide/**/*.scss'], ['_styleguideScss']);
});

gulp.task('serve', function() {
  connect.server({
    root: ['build'],
    port: 8000,
    livereload: true
  });
});

gulp.task('lint', function() {
  return gulp.src('./src/pivotal-ui/javascripts/**/*.js?(x)')
    .pipe(jsxTransform())
    .pipe(jshint().on('error', errorHandler.handleError))
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});

gulp.task('assets', [
  '_puiScss',
  '_styleguideScss',
  '_puiJs',
  '_otherAssets',
  '_testAssets',
]);

gulp.task('clean', function(done) {
  del(['build', 'test/build'], {force: true}, done);
});

// private

gulp.task('_puiScss', [
  '_compassBuildPui',
  '_compassBuildPuiRails',
  '_copyPuiScssToTest',
  '_hologramBuild',
  '_copyOtherHtmlFiles',
]);

gulp.task('_cleanBuiltPuiScss', function(done) {
  del([
    'build/pivotal-ui.css',
    'build/pivotal-ui-rails.css',
    'build/*.html',
    'test/components',
    'test/build/',
  ], {force: true}, function() {
    fs.mkdir('test/components', done);
  });
});

gulp.task('_compassBuildPui', ['_cleanBuiltPuiScss'], function() {
  return gulp.src(['src/pivotal-ui/pivotal-ui.scss'])
    .pipe(
      compass({
        config_file: './config/compass.rb',
        css: 'build',
        sass: 'src/pivotal-ui'
      }).on('error', errorHandler.handleError)
    );
});

gulp.task('_compassBuildPuiRails', ['_cleanBuiltPuiScss', '_compassBuildPui'], function() {
  return gulp.src('build/pivotal-ui.css')
    .pipe(
      replace(/url\(('|")\.\.\/fonts\//g, 'asset-url\($1fonts\/')
    )
    .pipe(
      replace(/url\(('|")\.\.\/images\//g, 'image-url\($1')
    )
    .pipe(rename('pivotal-ui-rails.css'))
    .pipe(gulp.dest('build/'));
});

gulp.task('_copyPuiScssToTest', ['_compassBuildPui'], function() {
  return gulp.src(['build/pivotal-ui.css'])
    .pipe(gulp.dest('test/build/'));
});

gulp.task('_hologramBuild', ['_cleanBuiltPuiScss'], function() {
  return gulp.src('')
    .pipe(shell('bundle exec hologram'))
    .on('error', errorHandler.handleError);
});

gulp.task('_copyOtherHtmlFiles', ['_cleanBuiltPuiScss'], function() {
  return gulp.src([
    'src/styleguide/404.html',
    'src/styleguide/pane.html',
    'src/styleguide/reset_password.html'
  ]).pipe(gulp.dest('./build/'));
});



gulp.task('_styleguideScss', [
  '_compassBuildStyleguide',
]);

gulp.task('_cleanBuiltStyleguideScss', function(done) {
  del(['build/styleguide.css'], {force: true}, done);
});

gulp.task('_compassBuildStyleguide', ['_cleanBuiltStyleguideScss'], function() {
  return gulp.src(['src/styleguide/styleguide.scss'])
    .pipe(
      compass({
        config_file: './config/compass.rb',
        css: 'build',
        sass: 'src'
      }).on('error', errorHandler.handleError)
    );
});



gulp.task('_puiJs', [
  '_buildPuiJs',
  '_buildPuiReactJs',
  '_copyPuiJsToTest',
]);

gulp.task('_cleanBuiltPuiJs', function(done) {
  del([
    'build/pivotal-ui.js',
    'build/pivotal-ui-react.js',
    'test/build/pivotal-ui-react.js',
  ], {force: true}, done);
});

gulp.task('_buildPuiJs', ['_cleanBuiltPuiJs'], function() {
  var b = browserify('./src/pivotal-ui/javascripts/pivotal-ui.js');

  return b.bundle()
    .pipe(source('./pivotal-ui.js'))
    .pipe(gulp.dest('build/'))
});

gulp.task('_buildPuiReactJs', ['_cleanBuiltPuiJs'], function() {
  var b = browserify('./src/pivotal-ui/javascripts/pivotal-ui-react.js');
  b.transform(reactify);

  return b.bundle()
    .pipe(source('./pivotal-ui-react.js'))
    .pipe(gulp.dest('build/'))
});

gulp.task('_copyPuiJsToTest', ['_cleanBuiltPuiJs', '_buildPuiReactJs'], function() {
  return gulp.src('build/pivotal-ui-react.js')
    .pipe(gulp.dest('test/build/'));
});



gulp.task('_otherAssets', [
  '_copyPrism',
  '_copyImages',
  '_copyFontAwesome',
  '_copySourceSansPro',
  '_copyStyleguideAssets',
  '_copyStaticfile',
  '_copyZeroClipboard',
]);

gulp.task('_cleanOtherAssets', function(done) {
  del([
    'build/syntax-highlighting',
    'build/images/',
    'build/fonts',
    'build/styleguide/*.js',
    'build/styleguide/github.css',
    'build/Staticfile',
    'build/zeroclipboard',
  ], {force: true}, done);
});

gulp.task('_copyPrism', ['_cleanOtherAssets'], function() {
  return gulp.src(['src/syntax-highlighting/*.css'])
    .pipe(gulp.dest('./build/syntax-highlighting/'));
});

gulp.task('_copyImages', ['_cleanOtherAssets'], function() {
  return gulp.src('src/images/**/*')
    .pipe(gulp.dest('./build/images/'));
});

gulp.task('_copyFontAwesome', ['_cleanOtherAssets'], function() {
  return gulp.src([
    'node_modules/font-awesome/fonts/*',
  ])
    .pipe(gulp.dest('./build/fonts/'));
});

gulp.task('_copySourceSansPro', ['_cleanOtherAssets'], function() {
  return gulp.src([
    'src/source-sans-pro/**/*',
    '!src/source-sans-pro/source-sans-pro.css.scss'
  ])
    .pipe(gulp.dest('./build/fonts/'));
});

gulp.task('_copyStyleguideAssets', ['_cleanOtherAssets'], function() {
  return gulp.src(['src/styleguide/*.js', 'src/styleguide/github.css'])
    .pipe(gulp.dest('./build/styleguide'));
});

gulp.task('_copyStaticfile', ['_cleanOtherAssets'], function() {
  return gulp.src(['src/Staticfile'])
    .pipe(gulp.dest('./build/'));
});

gulp.task('_copyZeroClipboard', ['_cleanOtherAssets'], function() {
  return gulp.src([
    'node_modules/zeroclipboard/dist/ZeroClipboard.js',
    'node_modules/zeroclipboard/dist/ZeroClipboard.swf',
  ])
    .pipe(gulp.dest('./build/zeroclipboard/'));
});



gulp.task('_testAssets', [
  '_copyTestFonts',
  '_copyTestImages',
  '_copyTestPrism',
  '_copyTestStyleguideAssets',
]);

gulp.task('_cleanTestAssets', function(done) {
  del([
    'test/build/fonts/**/*',
    'test/build/images/**/*',
    'test/build/syntax-highlighting/**/*',
  ], {force: true}, done);
});

gulp.task('_copyTestFonts', ['_cleanTestAssets', '_otherAssets'], function() {
  return gulp.src('build/fonts/**/*')
    .pipe(gulp.dest('./test/build/fonts'));
});

gulp.task('_copyTestImages', ['_cleanTestAssets', '_otherAssets'], function() {
  return gulp.src('build/images/**/*')
    .pipe(gulp.dest('./test/build/images'));
});

gulp.task('_copyTestPrism', ['_cleanTestAssets', '_otherAssets'], function() {
  return gulp.src('build/syntax-highlighting/**/*')
    .pipe(gulp.dest('./test/build/syntax-highlighting'));
});

gulp.task('_copyTestStyleguideAssets', ['_cleanTestAssets', '_otherAssets'], function() {
  return gulp.src('build/styleguide/github.css')
    .pipe(gulp.dest('./test/build/styleguide'));
});

