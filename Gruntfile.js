module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-contrib-coffee");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          "lib/js/complete-me.js": "src/coffee/complete-me.coffee",
          "docs/dist/js/docs.js": "docs/src/coffee/docs.coffee"
        }
      }
    },
    less: {
      development: {
        files: {
          "lib/css/complete-me.css": "src/less/complete-me.less",
          "docs/dist/css/docs.css": "docs/src/less/docs.less"
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          "lib/js/complete-me.min.js": "lib/js/complete-me.js"
        }
      }
    },
    cssmin: {
      my_target: {
        src: "lib/css/complete-me.css",
        dest: "lib/css/complete-me.min.css"
      }
    },
    watch: {
      files: ["src/less/*", "src/coffee/*", "docs/src/less/*", "docs/src/coffee/*"],
      tasks: ["coffee", "less", "uglify", "cssmin"],
      options: {
        livereload: true
      }
    }
  });
};