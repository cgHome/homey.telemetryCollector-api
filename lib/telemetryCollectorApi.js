'use strict';

const Homey = require('homey');

const crypto = require('node:crypto');

const AppApi = require('./telcoAppApi.js');

const { TELCO_LOGLEVEL } = require('./telcoConstants.js');

const TelemetryCollectorApi = Object.assign(Homey.SimpleClass.prototype, {
  // Log-Api
  logError(message, metadata = {}) {
    this.telcoLog({ level: TELCO_LOGLEVEL.ERROR, message }, metadata)
  },
  logWarning(message, metadata = {}) {
    this.telcoLog({ level: TELCO_LOGLEVEL.WARNING, message }, metadata)
  },
  logNotice(message, metadata = {}) {
    this.telcoLog({ level: TELCO_LOGLEVEL.NOTICE, message }, metadata)
  },
  logInfo(message, metadata = {}) {
    this.telcoLog({ level: TELCO_LOGLEVEL.INFO, message }, metadata)
  },
  logDebug(message, metadata = {}) {
    this.telcoLog({ level: TELCO_LOGLEVEL.DEBUG, message }, metadata)
  },
  telcoLog(log, metadata = {}) {
    if (log.level === TELCO_LOGLEVEL.NOTICE || log.level === TELCO_LOGLEVEL.INFO || log.level === TELCO_LOGLEVEL.DEBUG) {
      if (process.env.DEBUG === '1') {
        this.log(`[${log.level.toUpperCase()}] ${this._isDevice() ? `${this.getName()} > ${log.message}` : `${log.message}`}`);
      } else if (log.level === TELCO_LOGLEVEL.INFO) {
        this.log(log.message);
      }
    } else {
      if (process.env.DEBUG === '1') {
        this.error(`[${log.level.toUpperCase()}] ${this._isDevice() ? `${this.getName()} > ${log.message}` : `${log.message}`}`);
      } else if (log.level === TELCO_LOGLEVEL.ERROR) {
        this.error(log.message);
      }
    }

    log.message = `${this.constructor.name} ${this._isDevice() ? `> ${this.getName()} > ${log.message}` : `> ${log.message}`}`

    this._handleLog(log, metadata)
  },

  async _handleLog(log, metadata = {}) {
    log['timestamp'] = (new Date()).toISOString();

    log['metadata'] = {
      id: crypto.randomUUID(),
      app: (this.homey.manifest.name.en || this.homey.manifest.name).replace(' ', ''),
      appID: this.homey.manifest.id,
      debugMode: process.env.DEBUG === '1' ? true : false,
      facility: '18',             // SimpleLog-Definition (local2)
      facilityName: 'App',
      class: this.constructor.name,
      ...metadata,
    }

    if (this._isDevice()) {
      log['metadata'] = {
        ...log.metadata,
        deviceID: this.getData().id,
        deviceName: this.getName(),
        facility: '17',             // SimpleLog-Definition (local1)
        facilityName: 'Device',
      }
    }

    // Send log to TelemetryCollectorApp
    await AppApi.getInstance(this.homey)
      .put('addLog', log)
      .catch((error) => this.error(error))
  },

  _isDevice() {
    // Trick77 - Test if the method "this.getName()" exists, then it's a device !!
    return 'getName' in this
  }

})

module.exports = TelemetryCollectorApi;