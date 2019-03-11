var https = require('https');
var querystring = require('querystring');
const API_KEY = 'pk_test_2avaANL04219SY9rpZA4U8Rm';
const API_ENDPOINT = 'https://api.stripe.com/v1/charges';

var stripeAPI = {};



// suposto step 2
/**
 *
 *
 * (async () => {
  const charge = await stripe.charges.create({
    amount: 999,
    currency: 'usd',
    description: 'Example charge',
    source: token,
  });
})();
 */

stripeAPI.requestPaymentToken = function (phone, msg, callback) {
    // Validate parameters
    // phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    // msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    // if (phone && msg) {

    // Configure the request payload
    var payload = {
        'From': config.twilio.fromPhone,
        'To': '+1' + phone,
        'Body': msg
    };
    var stringPayload = querystring.stringify(payload);


    // Configure the request details
    var requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.twilio.com',
        'method': 'POST',
        'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
        'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function (res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            callback(false);
        } else {
            callback('Status code returned was ' + status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function (e) {
        callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

    // } else {
    //     callback('Given parameters were missing or invalid');
    // }
};


// Export the module
module.exports = stripeAPI;