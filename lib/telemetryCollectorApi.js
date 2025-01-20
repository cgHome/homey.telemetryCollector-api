'use strict';

const crypto = require('node:crypto');

const AppApi = require('./appApi.js');

const { TELCO_LOGLEVEL } = require('./telcoConstants.js')

const TelemetryCollectorApi = (superclass) => class extends superclass {

    // Log-Api
    logError(message, options = {}) {
        this.telCoLog({ level: TELCO_LOGLEVEL.ERROR, message }, options)
    }
    logWaring(message, options = {}) {
        this.telCoLog({ level: TELCO_LOGLEVEL.WARNING, message }, options)
    }
    logNotice(message, options = {}) {
        this.telCoLog({ level: TELCO_LOGLEVEL.NOTICE, message }, options)
    }
    logInfo(message, options = {}) {
        this.telCoLog({ level: TELCO_LOGLEVEL.INFO, message }, options)
    }
    logDebug(message, options = {}) {
        this.telCoLog({ level: TELCO_LOGLEVEL.DEBUG, message }, options)
    }
    telCoLog(log, options = {}) {
        if (log.level === TELCO_LOGLEVEL.NOTICE || log.level === TELCO_LOGLEVEL.INFO || log.level === TELCO_LOGLEVEL.DEBUG) {
            if (process.env.DEBUG === '1') {
                this.log(`[${log.level.toUpperCase()}] ${this.#isDevice() ? `${this.getName()} > ${log.message}` : `${log.message}`}`);
            } else if (log.level === TELCO_LOGLEVEL.INFO) {
                this.log(log.message);
            }
        } else {
            if (process.env.DEBUG === '1') {
                this.error(`[${log.level.toUpperCase()}] ${this.#isDevice() ? `${this.getName()} > ${log.message}` : `${log.message}`}`);
            } else if (log.level === TELCO_LOGLEVEL.ERROR) {
                this.error(log.message);
            }
        }

        log.message = `${this.constructor.name} ${this.#isDevice() ? `${this.getName()} > ${log.message}` : `> ${log.message}`}`

        this.#handleLog(log)
    }

    async #handleLog(data) {
        let log = {
            ...data, ...{
                ts: (new Date).toISOString(),
                metadata: {
                    id: crypto.randomUUID(),
                    application: (this.homey.manifest.name.en || this.homey.manifest.name).replace(' ', ''),
                    applicationId: this.homey.manifest.id,
                    facility: '18',             // SimpleLog-Definition (local2)
                    facilityName: 'App',
                    class: this.constructor.name,
                }
            }
        }

        if (this.#isDevice()) {
            log.metadata = {
                ...log.metadata, ...{
                    deviceId: this.getData().id,
                    deviceName: this.getName(),
                    facility: '17',             // SimpleLog-Definition (local1)
                    facilityName: 'Device',
                }
            }
        }

        // Send log to TelemetryCollectorApp
        await AppApi.getInstance(this.homey)
            .put('addLog', log)
            .catch((error) => this.error(error))
    }

    #isDevice() {
        // Trick77 - Test if the method "this.getName()" exists, then it's a device !!
        return 'getName' in this
    }
}

module.exports = TelemetryCollectorApi;