var gulp        = require('gulp');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var harp        = require('harp');

gulp.task('harp-server', function () {
    harp.server(__dirname, {
        port: 4000
    }, function () {
        browserSync({
            proxy: "localhost:4000",
            open: false
        });

        gulp.watch("public/css/**/*.sass", function () {
            reload("main.css", {stream: true});
        });

        gulp.watch(["public/**/*.ejs", "public/**/*.jade", "public/js/**/*.js", "**/*.json"], function () {
            reload();
        });
    })
});

gulp.task('default', ['harp-server']);
