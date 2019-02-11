/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = (data, callback) => {
  callback(200);
};

// Not-Found
handlers.notFound = (data, callback) => {
  callback(404);
};

// Users
handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: fullName, email, password, address
// Optional data: none
handlers._users.post = (data, callback) => {

  // Check that all required fields are filled out
  var fullName = typeof (data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 10 ? data.payload.email.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;


  if (fullName && email && password && address) {
    // Make sure the user doesnt already exist
    _data.read('users', email, (err, data) => {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            'fullName': fullName,
            'email': email,
            'hashedPassword': hashedPassword,
            'address': address
          };

          // Store the user
          _data.create('users', email, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { 'Error': 'Could not hash the user\'s password.' });
        }

      } else {
        // User alread exists
        callback(400, { 'Error': 'A user with that email already exists' });
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }

};

// Required data: email
// Optional data: none
handlers._users.get = (data, callback) => {
  // Check that email number is valid
  var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length == 10 ? data.queryStringObject.email.trim() : false;
  if (email) {

    // Get token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email number
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." })
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Required data: email
// Optional data: fullName, password (at least one must be specified)
handlers._users.put = (data, callback) => {
  // Check for required field
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length == 10 ? data.payload.email.trim() : false;
  var address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  // Check for optional fields
  var fullName = typeof (data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (fullName || password || address) {

      // Get token from headers
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the email number
      handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {

          // Lookup the user
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              // Update the fields if necessary
              if (fullName) {
                userData.fullName = fullName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              if (fullName) {
                userData.address = address;
              }
              // Store the new updates
              _data.update('users', email, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not update the user.' });
                }
              });
            } else {
              callback(400, { 'Error': 'Specified user does not exist.' });
            }
          });
        } else {
          callback(403, { "Error": "Missing required token in header, or token is invalid." });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing fields to update.' });
    }
  } else {
    callback(400, { 'Error': 'Missing required field.' });
  }

};

// Required data: email
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
  // Check that email number is valid
  var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length == 10 ? data.queryStringObject.email.trim() : false;
  if (email) {

    // Get token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the email number
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            _data.delete('users', email, (err) => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { 'Error': 'Could not delete the specified user' });
              }
            });
          } else {
            callback(400, { 'Error': 'Could not find the specified user.' });
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    // Lookup the user who matches that email number
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the new token' });
            }
          });
        } else {
          callback(400, { 'Error': 'Password did not match the specified user\'s stored password' });
        }
      } else {
        callback(400, { 'Error': 'Could not find the specified user.' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field(s).' })
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  // Check that id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field, or field invalid' })
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the existing token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token\'s expiration.' });
            }
          });
        } else {
          callback(400, { "Error": "The token has already expired, and cannot be extended." });
        }
      } else {
        callback(400, { 'Error': 'Specified user does not exist.' });
      }
    });
  } else {
    callback(400, { "Error": "Missing required field(s) or field(s) are invalid." });
  }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
  // Check that id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Delete the token
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the specified token.' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};
handlers._products = {};
// Tokens
handlers.products = (data, callback) => {
  var acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._products[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._products.get = (data, callback) => {
  // Lookup the products
  _data.read('products', 'products', (err, tokenData) => {
    if (!err && tokenData) {
      callback(200, tokenData);
    } else {
      callback(404);
    }
  });

}
handlers._orders = {};
// Tokens
handlers.orders = (data, callback) => {
  var acceptableMethods = ['get', 'post', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._orders[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._orders.get = (data, callback) => {
  // Lookup the products
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  _data.read('products', id, (err, tokenData) => {
    if (!err && tokenData) {
      callback(200, tokenData);
    } else {
      callback(404);
    }
  });


}

handlers._orders.post = (data, callback) => {

}

handlers._orders.put = (data, callback) => {

}

handlers._orders.delete = (data, callback) => {

}


// Export the handlers
module.exports = handlers;
