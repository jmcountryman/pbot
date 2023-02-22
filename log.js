const moment = require('moment');

const log = function log(message)
{
    const timestamp = moment();

    console.log(`[${timestamp}] ${message}`);
};

module.exports = log;
