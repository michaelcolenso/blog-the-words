var gulp        = require('gulp');
var $ = require('gulp-load-plugins')();
var harp        = require('harp')
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var deploy      = require('gulp-gh-pages');
var cp          = require('child_process');
var env         = require('gulp-env');
var argv = require('minimist')(process.argv.slice(2));


/**
 * Serve the Harp Site
 */
gulp.task('serve', function () {
  harp.server(__dirname, {
    port: 9000
  }, function () {
    browserSync({
      proxy: "localhost:9000",
      open: false,
      /* Hide the notification. It gets annoying */
      notify: {
        styles: ['opacity: 0', 'position: absolute']
      }
    });
    /**
     * Watch for sass changes, tell BrowserSync to refresh main.css
     */
    gulp.watch("public/**/*.sass", function () {
      reload("main.css", {stream: true});
    });
    /**
     * Watch for all other changes, reload the whole page
     */
    gulp.watch(["public/**/*.ejs", "public/**/*.json", "public/**/*.md"], function () {
      reload();
    });
  })
});


gulp.task('set-env', function () {
    env({
        file: ".env.json",
        vars: {
            //any vars you want to overwrite
        }
    });
});


/**
 * Build the Harp Site
 */
gulp.task('build', function (done) {
  cp.exec('harp compile . dist', {stdio: 'inherit'})
    .on('close', done)
});

/**
 * Push build to gh-pages
 */
gulp.task('deploy', ['build'], function () {
  return gulp.src("./dist/**/*")
    .pipe(deploy());
});


/**
 * clean it up
 */
gulp.task('clean', function () {  
  return gulp.src('dist', {read: false})
    .pipe($.clean());
});


/**
 *  Publish to Amazon S3 / CloudFront
 */
gulp.task('s3deploy', ['clean', 'set-env', 'build'], function () {
    var awspublish = require('gulp-awspublish');
    var aws = {
        "key": process.env.AWS_KEY,
        "secret": process.env.AWS_SECRET,
        "bucket": 'www.colenso.org',
        "region": 'us-standard',
        "distributionId": 'E3KEXN4TB284DR'
    };
    var publisher = awspublish.create(aws);
    var headers = {
        'Cache-Control': 'max-age=315360000, no-transform, public'
    };
 
  return gulp.src('dist/**/*')
            
        // Add a revisioned suffix to the filename for each static asset
        .pipe($.revAll({
          ignore: [
            /^\/favicon.ico$/g,
            /^\/apple-touch-icon.png$/g        
          ]
        }))
                
        // Gzip, set Content-Encoding headers
        .pipe(awspublish.gzip())
        
        // Publisher will add Content-Length, Content-Type and headers specified above
        // If not specified it will set x-amz-acl to public-read by default
        .pipe(publisher.publish(headers))

        // Print upload updates to console
        .pipe(awspublish.reporter())
        
        // Updates the Default Root Object of a CloudFront distribution
        .pipe($.cloudfront(aws));
});


/**
 * Default task, running `gulp` will fire up the Harp site,
 * launch BrowserSync & watch files.
 */
gulp.task('default', ['serve']);
