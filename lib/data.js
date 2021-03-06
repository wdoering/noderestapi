/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');

/**
 * Write data to a file
 * @param {dir} | folder where data is contained
 * @param {file} | file name where data is contained
 * @param {data} | serialized object to be saved into the file
 * @param {callback} | function to be invoked in each case with appropriate http status code
 */
lib.create = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });

};

// Read data from a file
/**
 * @param {dir} | folder where data is contained
 * @param {file} | file name where data is contained
 * @param {callback} | function to be invoked in each case with appropriate http status code
 */
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

/**
 * Update data in a file
 * @param {dir} | folder where data is contained
 * @param {file} | file name where data is contained
 * @param {data} | serialized object to be saved into the file
 * @param {callback} | function to be invoked in each case with appropriate http status code
 * @returns {boolean} | if all went well, it returns false, else it returns an error message
 */
lib.update = function (dir, file, data, callback) {

  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Truncate the file
      fs.truncate(fileDescriptor, function (err) {
        if (!err) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open file for updating, it may not exist yet');
    }
  });

};

// 
/**
 * Delete a file
 * @param {dir} | folder where data is contained
 * @param {file} | file name where data is contained
 * @param {callback} | function to be invoked in each case of error
 */
lib.delete = function (dir, file, callback) {

  // Unlink the file from the filesystem
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    callback(err);
  });

};

// Export the module
module.exports = lib;
