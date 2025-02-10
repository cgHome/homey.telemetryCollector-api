'use strict';

const install = require('./lib/telemetryCollectorApi')

const { TELCO_LOGLEVEL } = require('./lib/telcoConstants');

module.exports = { install, TELCO_LOGLEVEL }
