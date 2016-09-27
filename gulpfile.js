'use strict';

//Main gulp pointer
var gulp = require('gulp');

//watch
var newer = require('gulp-newer');
var del = require('del');
var path = require('path');

//Plugins
//var less = require('gulp-less');
var sass   = require('gulp-sass');
var cssmin = require('gulp-minify-css');
var rename = require('gulp-rename');

//Local testing
var webserver = require('gulp-webserver');

var paths = {
    assets:  'build/assets/**',
    algolia: 'build/src/**',
    fonts:   'build/fonts/**',
    scripts: 'build/js/**.js',
    json:    'build/data/**.json',
    images:  ['build/img/**.{jpg,gif,svg,png}', 'build/img/**/**.{jpg,gif,svg,png}', 'build/img/**/**/**.{jpg,gif,svg,png}', '!build/img/**.db', '!build/img/**/**.db'],
    html:    ['build/**.html', 'build/pages/**.html', 'build/includes/**.html'], 
    sass:    ['build/css/**.scss', 'build/themes/**.scss', '!build/**/_helpers.scss'],
    css:     ['build/css/**.css', '!build/css/**.scss']  
}

var base = { base: 'build' };
var dest = 'dist';


gulp.task('html', function () {
    return gulp.src(paths.html, base)
               .pipe(newer(dest))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

gulp.task('images', function (done) {
    return gulp.src(paths.images, base)
               .pipe(newer(dest))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

gulp.task('scripts', function () {
    return gulp.src(paths.scripts, base)
               .pipe(newer(dest))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

gulp.task('css', function () {
    return gulp.src(paths.css, base)
               .pipe(newer(dest))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

gulp.task('sass', function () {
    return gulp.src(paths.sass, base)
               .pipe(newer(dest))
               .pipe(sass())
               .on('error', outputError)                    
               .pipe(gulp.dest(dest))
               .on('error', outputError)
               .pipe(cssmin())               
               .pipe(rename( { suffix: '.min' }))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

//Process external assets task. 
//Basically downloaded plugins / frameworks should be processed here
//In this case I'm processing an algolia folder as well
gulp.task('external', function () {
    return gulp.src([paths.assets, paths.algolia, paths.fonts, paths.json, paths.json], base)
               .pipe(newer(dest))
               .pipe(gulp.dest(dest))
               .on('error', outputError);
});

//Local webserver
gulp.task('webserver', function () {
    gulp.src('dist')
        .pipe(webserver({
            livereload: true,
            open: true
        }))
        .on('error', outputError);               
});

//Watch task
gulp.task('watch', function () {
    
    //Watchers for basic assets. This will sync the build folder 
    //with the dist folder. 
    var watchHtml    = gulp.watch(paths.html, ['html']);
    var watchImages  = gulp.watch(paths.images, ['images']);    
    var watchCss     = gulp.watch(paths.css, ['css']);    
    var watchScripts = gulp.watch(paths.scripts, ['scripts']);
    var watchExt     = gulp.watch([paths.assets, paths.algolia, paths.fonts, paths.json], ['external']);

    //@TODO: Less file is a little more complex, and doesn't do 
    //       a simple glob > src > dest. 
    gulp.watch(paths.sass, ['sass']);           

    
    watchExt.on('change', function (ev) {
        if(ev.type === 'deleted') {
            del(path.relative('./', ev.path).replace('build', 'dist'));
        }
    }).on('error', outputError);    

    watchHtml.on('change', function (ev) {
        if(ev.type === 'deleted') {
            del(path.relative('./', ev.path).replace('build', 'dist'));
        }
    }).on('error', outputError);

    watchImages.on('change', function (ev) {
        if(ev.type === 'deleted') {
            del(path.relative('./', ev.path).replace('build', 'dist'));
        }
    }).on('error', outputError);

    watchCss.on('change', function (ev) {
        if(ev.type === 'deleted') {
            del(path.relative('./', ev.path).replace('build', 'dist'));
        }
    }).on('error', outputError);      

    watchScripts.on('change', function (ev) {
        if(ev.type === 'deleted') {
            del(path.relative('./', ev.path).replace('build', 'dist'));
        }
    }).on('error', outputError);
});

//Main gulp task definitions
gulp.task('build', ['external','html', 'images', 'css', 'scripts', 'sass']);
gulp.task('dev', ['watch', 'webserver']);

gulp.task('default', ['build', 'dev']);

//Output Error catch
function outputError (error) {
    console.log(error.toString());
    this.emit('end');
}
