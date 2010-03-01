exports.Stats = process.Stats;

process.Stats.prototype._checkModeProperty = function (property) {
  return ((this.mode & property) === property);
};

process.Stats.prototype.isDirectory = function () {
  return this._checkModeProperty(process.S_IFDIR);
};

process.Stats.prototype.isFile = function () {
  return this._checkModeProperty(process.S_IFREG);
};

process.Stats.prototype.isBlockDevice = function () {
  return this._checkModeProperty(process.S_IFBLK);
};

process.Stats.prototype.isCharacterDevice = function () {
  return this._checkModeProperty(process.S_IFCHR);
};

process.Stats.prototype.isSymbolicLink = function () {
  return this._checkModeProperty(process.S_IFLNK);
};

process.Stats.prototype.isFIFO = function () {
  return this._checkModeProperty(process.S_IFIFO);
};

process.Stats.prototype.isSocket = function () {
  return this._checkModeProperty(process.S_IFSOCK);
};



exports.readFile = process.fs.readFile;
exports.readFileSync = process.fs.readFileSync;

// Used by fs.open and friends
function stringToFlags(flag) {
  // Only mess with strings
  if (typeof flag !== 'string') {
    return flag;
  }
  switch (flag) {
    case "r": return process.O_RDONLY;
    case "r+": return process.O_RDWR;
    case "w": return process.O_CREAT | process.O_TRUNC | process.O_WRONLY;
    case "w+": return process.O_CREAT | process.O_TRUNC | process.O_RDWR;
    case "a": return process.O_APPEND | process.O_CREAT | process.O_WRONLY; 
    case "a+": return process.O_APPEND | process.O_CREAT | process.O_RDWR;
    default: throw new Error("Unknown file open flag: " + flag);
  }
}

function noop () {}

// Yes, the follow could be easily DRYed up but I provide the explicit
// list to make the arguments clear.

exports.close = function (fd, callback) {
  process.fs.close(fd, callback || noop);
};

exports.closeSync = function (fd) {
  return process.fs.close(fd);
};

exports.open = function (path, flags, mode, callback) {
  if (mode === undefined) { mode = 0666; }
  process.fs.open(path, stringToFlags(flags), mode, callback || noop);
};

exports.openSync = function (path, flags, mode) {
  if (mode === undefined) { mode = 0666; }
  return process.fs.open(path, stringToFlags(flags), mode);
};

exports.read = function (fd, length, position, encoding, callback) {
  encoding = encoding || "binary";
  process.fs.read(fd, length, position, encoding, callback || noop);
};

exports.readSync = function (fd, length, position, encoding) {
  encoding = encoding || "binary";
  return process.fs.read(fd, length, position, encoding);
};

exports.write = function (fd, data, position, encoding, callback) {
  encoding = encoding || "binary";
  process.fs.write(fd, data, position, encoding, callback || noop);
};

exports.writeSync = function (fd, data, position, encoding) {
  encoding = encoding || "binary";
  return process.fs.write(fd, data, position, encoding);
};

exports.rename = function (oldPath, newPath, callback) {
  process.fs.rename(oldPath, newPath, callback || noop);
};

exports.renameSync = function (oldPath, newPath) {
  return process.fs.rename(oldPath, newPath);
};

exports.truncate = function (fd, len, callback) {
  process.fs.truncate(fd, len, callback || noop);
};

exports.truncateSync = function (fd, len) {
  return process.fs.truncate(fd, len);
};

exports.rmdir = function (path, callback) {
  process.fs.rmdir(path, callback || noop);
};

exports.rmdirSync = function (path) {
  return process.fs.rmdir(path);
};

exports.mkdir = function (path, mode, callback) {
  process.fs.mkdir(path, mode, callback || noop);
};

exports.mkdirSync = function (path, mode) {
  return process.fs.mkdir(path, mode);
};

exports.sendfile = function (outFd, inFd, inOffset, length, callback) {
  process.fs.sendfile(outFd, inFd, inOffset, length, callback || noop);
};

exports.sendfileSync = function (outFd, inFd, inOffset, length) {
  return process.fs.sendfile(outFd, inFd, inOffset, length);
};

exports.readdir = function (path, callback) {
  process.fs.readdir(path, callback || noop);
};

exports.readdirSync = function (path) {
  return process.fs.readdir(path);
};

exports.lstat = function (path, callback) {
  process.fs.lstat(path, callback || noop);
};

exports.stat = function (path, callback) {
  process.fs.stat(path, callback || noop);
};

exports.lstatSync = function (path) {
  return process.fs.lstat(path);
};

exports.statSync = function (path) {
  return process.fs.stat(path);
};

exports.readlink = function (path, callback) {
  process.fs.readlink(path, callback || noop);
};

exports.readlinkSync = function (path) {
  return process.fs.readlink(path);
};

exports.symlink = function (destination, path, callback) {
  process.fs.symlink(destination, path, callback || noop);
};

exports.symlinkSync = function (destination, path) {
  return process.fs.symlink(destination, path);
};

exports.link = function (srcpath, dstpath, callback) {
  process.fs.link(srcpath, dstpath, callback || noop);
};

exports.linkSync = function (srcpath, dstpath) {
  return process.fs.link(srcpath, dstpath);
};

exports.unlink = function (path, callback) {
  process.fs.unlink(path, callback || noop);
};

exports.unlinkSync = function (path) {
  return process.fs.unlink(path);
};

exports.chmod = function (path, mode, callback) {
  process.fs.chmod(path, mode, callback || noop);
};

exports.chmodSync = function (path, mode) {
  return process.fs.chmod(path, mode);
};

function writeAll (fd, data, encoding, callback) {
  exports.write(fd, data, 0, encoding, function (writeErr, written) {
    if (writeErr) {
      exports.close(fd, function () {
        if (callback) callback(writeErr);
      });
    } else {
      if (written === data.length) {
        exports.close(fd, callback);
      } else {
        writeAll(fd, data.slice(written), encoding, callback);
      }
    }
  });
}

exports.writeFile = function (path, data, encoding_, callback) {
  var encoding = (typeof(encoding_) == 'string' ? encoding_ : 'utf8');
  var callback_ = arguments[arguments.length - 1];
  var callback = (typeof(callback_) == 'function' ? callback_ : null);
  exports.open(path, 'w', 0666, function (openErr, fd) {
    if (openErr) {
      if (callback) callback(openErr);
    } else {
      writeAll(fd, data, encoding, callback);
    }
  });
};

exports.writeFileSync = function (path, data, encoding) {
  encoding = encoding || "utf8"; // default to utf8
  var fd = exports.openSync(path, "w");
  var written = 0;
  while (written < data.length) {
    written += exports.writeSync(fd, data, 0, encoding);
    data = data.slice(written);
  }
  exports.closeSync(fd);
};

exports.cat = function () {
  throw new Error("fs.cat is deprecated. Please use fs.readFile instead.");
};


exports.catSync = function () {
  throw new Error("fs.catSync is deprecated. Please use fs.readFileSync instead.");
};
