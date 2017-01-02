var source      = require('vinyl-source-stream');
var gulp        = require('gulp');
var gutil       = require('gulp-util');
var browserify  = require('browserify');
var babelify    = require('babelify');
var watchify    = require('watchify');
var notify      = require('gulp-notify');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var imagemin    = require('gulp-imagemin');
var cp          = require('child_process');
var sequence    = require('run-sequence');

var basePaths = {
    src: './_src/_assets/',
    dest: './_public/assets/',
};

var paths = {
    images: {
        src: basePaths.src + '_images/',
        dest: basePaths.dest + 'images/'
    },
    styles: {
        src: basePaths.src + '_scss/',
        dest: basePaths.dest + 'css/',
    },
    scripts: {
        src: basePaths.src + '_scripts/',
        dest: basePaths.dest + 'js/',
    },
    sounds: {
        src: basePaths.src + '_sounds/',
        dest: basePaths.dest + 'sounds/'
    }
};

var appFiles = {
    content: ['./_src/**/*.html', './_src/**/*.md'],
    images: paths.images.src + '*',
    styles: paths.styles.src + '**/*.scss',
    scripts: paths.scripts.src + '**/*.js',
    sounds: paths.sounds.src + '*'
};

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

gulp.task('images', function() {
    return gulp.src(appFiles.images)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images.dest))
});

gulp.task('sass', function () {
    return gulp.src(appFiles.styles)
        .pipe(sass({
            includePaths: ['scss'],
        }))
        .on('error', sass.logError)
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.reload({stream:true}))
});

gulp.task('scripts', function() {
  return buildScript('main.js', false); // this will run once because we set watch to false
});

gulp.task('sounds', function() {
    return gulp.src(appFiles.sounds)
        .on('error', handleErrors)
        .pipe(gulp.dest(paths.sounds.dest))
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', function() {
    browserSync({
        server: { baseDir: '_public' }
    });
});

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildScript(file, watch) {
  var props = {
    entries: [paths.scripts.src + file],
    debug : true,
    cache: {},
    packageCache: {},
    transform:  [babelify.configure({stage : 0 })]
  };

  // watchify() if watch requested, otherwise run browserify() once
  var bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    var stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(browserSync.reload({stream:true}))
  }

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  // run it once the first time buildScript is called
  return rebundle();
}

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch(appFiles.styles, ['sass']);
    gulp.watch(appFiles.content, ['build']);
    return buildScript('main.js', true);
});

gulp.task('build', function(callback) {
  sequence('jekyll-build', ['images', 'sass', 'scripts', 'sounds'], callback);
});

gulp.task('serve', function(callback) {
  sequence('build', 'browser-sync', 'watch', callback);
});

gulp.task('default', ['serve']);
