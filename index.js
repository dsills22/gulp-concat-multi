'use strict';

let through = require('through2');
let path = require('path');
let File = require('vinyl');
let Concat = require('concat-with-sourcemaps');

// file can be a vinyl file object or a string
// when a string it will construct a new one
module.exports = function(file, opt) {
  if (!file) {
    throw new Error('gulp-concat-multiple: Missing file option');
  }
  opt = opt || {};
  opt.files = opt.files || 1;
  opt.suffix = opt.suffix || "-";

  // to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
  if (typeof opt.newLine !== 'string') {
    opt.newLine = '\n';
  }

  let isUsingSourceMaps = false;
  let latestFile;
  let latestMod;
  let fileName;
  let concat;
  let fileSizes = [];
  let totalSize = 0;
  let desiredAvgSize = 0.0;

  if (typeof file === 'string') {
    fileName = file;
  } else if (typeof file.path === 'string') {
    fileName = path.basename(file.path);
  } else {
    throw new Error('gulp-concat-multiple: Missing path in file options');
  }

  let parts = fileName.split(".");
  let ext = parts.pop();
  let fileNameNoExt = parts.join(".");

  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    // we don't do streams (yet)
    if (file.isStream()) {
      this.emit('error', new Error('gulp-concat-multiple: Streaming not supported'));
      cb();
      return;
    }

    // enable sourcemap support for concat
    // if a sourcemap initialized file comes in
    if (file.sourceMap && !isUsingSourceMaps) {
      isUsingSourceMaps = true;
    }

    // set latest file if not already set,
    // or if the current file was modified more recently.
    if (!latestMod || file.stat && file.stat.mtime > latestMod) {
      latestFile = file;
      latestMod = file.stat && file.stat.mtime;
    }

    if(file && file.stat) {
      fileSizes.push({"file": file, "size": file.stat.size});
      totalSize += file.stat.size;
    }

    cb();
  }

  function endStream(cb) {
    desiredAvgSize = totalSize / opt.files * 1.;
    if(desiredAvgSize <= 0) {
      cb();
      return;
    }

    let currJoinedFile = null;
    let currJoinedFileSize = 0;
    let currConcat = null;
    let fileNum = 0;

    for(let i = 0; i < fileSizes.length; i++) {
      let candFile = fileSizes[i].file;
      let candFileSize = fileSizes[i].size;

      if(currJoinedFileSize >= desiredAvgSize && currConcat && currJoinedFile) {
        currJoinedFile.contents = currConcat.content;
        if (currConcat.sourceMapping) {
          currJoinedFile.sourceMap = JSON.parse(currConcat.sourceMap);
        }
        this.push(currJoinedFile);

        currJoinedFile = null;
        currJoinedFileSize = 0;
        currConcat = null;
      }

      if(!currJoinedFile) {
        let newFileName = fileNameNoExt + opt.suffix + fileNum + "." + ext;
        fileNum++;
        currConcat = new Concat(isUsingSourceMaps, newFileName, opt.newLine);

        if (typeof file === 'string') {
          currJoinedFile = latestFile.clone({contents: false});
          currJoinedFile.path = path.join(latestFile.base, newFileName);
        } else {
          currJoinedFile = new File(newFileName);
        }
      }

      currJoinedFileSize += candFileSize;
      currConcat.add(candFile.relative, candFile.contents, candFile.sourceMap);
    }

    if(currJoinedFile) {
      currJoinedFile.contents = currConcat.content;
      if (currConcat.sourceMapping) {
        currJoinedFile.sourceMap = JSON.parse(currConcat.sourceMap);
      }
      this.push(currJoinedFile);
    }

    cb();
  }

  return through.obj(bufferContents, endStream);
};
