const del = require("del");
const path = require("path");
const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("autoprefixer");
const postcss = require("gulp-postcss");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const cleanCSS = require("gulp-clean-css");
const htmltpl = require("gulp-html-tpl");
const artTemplate = require("art-template");
const browserSync = require("browser-sync");
const imagemin = require("gulp-imagemin");
const changed = require("gulp-changed");

artTemplate.defaults.rules.unshift({
  test: /{{raw}}([\w\W]*?){{\/raw}}/,
  use: function (match, code) {
    return {
      output: "raw",
      code: JSON.stringify(code),
    };
  },
});

const paths = {
  src: {
    style: "src/style/",
    styleLib: "src/style/libs/*.css",
    CSS: "src/assets/css/",
    script: "src/script/",
    scriptLib: "src/script/libs/*.js",
    JS: "src/assets/js/",
    views: "src/views/",
    pages: "src/pages/",
    images: "src/assets/images/",
    data: "src/data/",
    Librarys: "src/assets/Librarys/",
  },
  build: {
    root: "build/",
    CSS: "build/assets/css/",
    JS: "build/assets/js/",
    pages: "build/pages/",
    images: "build/assets/images/",
    data: "build/data/",
    Librarys: "build/assets/Librarys/",
  },
};

// task src
gulp.task("delHtml", function () {
  return del([paths.src.pages + "**/*"]);
});

gulp.task("compilePublic", ["delHtml"], function () {
  return gulp
    .src(paths.src.views + "**/*")
    .pipe(
      htmltpl({
        engine: function (template, data) {
          if (!template) {
            return false;
          }
          return artTemplate.compile(template)(data);
        },
      })
    )
    .pipe(gulp.dest(paths.src.pages))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task("compileHtml", function () {
  return gulp
    .src([
      paths.src.views + "**/*.html",
      "!" + paths.src.views + "public/*.html",
    ])
    .pipe(changed(paths.src.pages))
    .pipe(
      htmltpl({
        engine: function (template, data) {
          if (!template) {
            return false;
          }
          return artTemplate.compile(template)(data);
        },
      })
    )
    .pipe(gulp.dest(paths.src.pages))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task("sass", function () {
  return (
    gulp
      .src(paths.src.style + "module/*.scss")
      .pipe(
        changed(paths.src.CSS, {
          extension: ".css",
        })
      )
      // .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      .pipe(
        postcss([
          autoprefixer({
            browsers: [
              "last 4 versions",
              "not ie <= 8",
              "Android >= 4.0",
              "ios > 7",
              "ff >= 15",
            ],
          }),
        ])
      )
      // .pipe(sourcemaps.write("./maps"))
      .pipe(gulp.dest(paths.src.CSS))
      .pipe(
        browserSync.reload({
          stream: true,
        })
      )
  );
});

gulp.task("scriptbabel", function () {
  return gulp
    .src(paths.src.script + "es6/*.js")
    .pipe(changed(paths.src.JS))
    .pipe(
      babel({
        presets: ["env"],
      })
    )
    .pipe(gulp.dest(paths.src.JS));
});

gulp.task("scriptmin", function () {
  return gulp
    .src(paths.src.scriptLib)
    .pipe(concat("core.js"))
    .pipe(uglify())
    .pipe(gulp.dest(paths.src.JS));
});

gulp.task("cssmin", function () {
  return gulp
    .src(paths.src.styleLib)
    .pipe(concat("core.css"))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.src.CSS));
});

gulp.task("server", function () {
  browserSync.init({
    server: {
      baseDir: "./src",
    },
    port: 3001,
    startPath: "/pages",
  });
});

gulp.task("watch", ["server"], function () {
  gulp.watch(
    [paths.src.views + "**/*.html", "!" + paths.src.views + "public/*.html"],
    ["compileHtml"]
  );
  gulp.watch(paths.src.views + "public/*.html", ["compilePublic"]);
  gulp.watch(paths.src.style + "**/*.scss", ["sass"]);
  gulp.watch(paths.src.script + "es6/*.js", ["scriptbabel"]);
  gulp.watch(paths.src.scriptLib, ["scriptmin"]);
  gulp.watch(paths.src.styleLib, ["cssmin"]);
});

gulp.task("default", ["watch"]);

// task src end

// build task
gulp.task("delbuild", function () {
  return del([paths.build.root + "**/*"]);
});

gulp.task("moveData", ["delbuild"], function () {
  return gulp.src(paths.src.data + "**/*").pipe(gulp.dest(paths.build.data));
});

gulp.task("moveLib", ["moveData"], function () {
  return gulp
    .src(paths.src.Librarys + "**/*")
    .pipe(gulp.dest(paths.build.Librarys));
});

gulp.task("moveScript", ["moveLib"], function () {
  return gulp
    .src(paths.src.JS + "*.js")
    .pipe(uglify())
    .pipe(gulp.dest(paths.build.JS));
});

gulp.task("moveStyle", ["moveScript"], function () {
  return gulp
    .src(paths.src.CSS + "*.css")
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.build.CSS));
});

gulp.task("movePages", ["moveStyle"], function () {
  return gulp.src(paths.src.pages + "**/*").pipe(gulp.dest(paths.build.pages));
});

gulp.task("delPublic", ["movePages"], function () {
  return del([paths.build.pages + "public"]);
});

gulp.task("moveImages", ["delPublic"], function () {
  return gulp
    .src(paths.src.images + "**/*")
    .pipe(gulp.dest(paths.build.images));
});

gulp.task("build", ["moveImages"]);
