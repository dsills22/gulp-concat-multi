
## Installation

`npm install --save-dev gulp-concat-multi`

## Information

Shamelessly copied from gulp-concat and edited in order to output multiple files of the same size due to my project's requirements.

<table>
<tr>
<td>Package</td><td>gulp-concat-multi</td>
</tr>
<tr>
<td>Description</td>
<td>Concatenates files into N target files</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.10</td>
</tr>
</table>

## Usage

```js
var concat = require('gulp-concat-multi');

gulp.task('scripts', function() {
  return gulp.src('./lib/*.js')
    .pipe(concat('all.js', {"files": 4}))
    .pipe(gulp.dest('./dist/'));
});
```

Outputs 4 files: all-0.js, all-1.js, all-2.js, all-3.js of more or less the same size. You can also specify a "suffix" as well as "files" in order to control the character between the file name and the file number. For example, the default "suffix" is "-".
