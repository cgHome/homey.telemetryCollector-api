'use strict';

const AppApi = require('./appApi.js');

module.exports = TelemetryCollectorApi = (superclass) => class extends superclass {

    // Log-Api
    logError(message, options = {}) {
        this.telCoLog({ level: 'error', message, options })
    }
    logWaring(message, options = {}) {
        this.telCoLog({ level: 'warning', message, options })
    }
    logNotice(message, options = {}) {
        this.telCoLog({ level: 'notice', message, options })
    }
    logInfo(message, options = {}) {
        this.telCoLog({ level: 'info', message, options })
    }
    logDebug(message, options = {}) {
        this.telCoLog({ level: 'debug', message, options })
    }
    telCoLog(log, options = {}) {
        this.#handleLog(log)
    }

    async #handleLog(data) {
        let log = {
            ...data, ...{
                ts: (new Date).toISOString(),
                message: `${this.owner.constructor.name}${this.#isDevice() ? `::${this.getName()} > ${data.message}` : ` > ${data.message}`}`,
                metadata: {
                    application: (this.homey.manifest.name.en || this.homey.manifest.name).replace(' ', ''),
                    applicationId: this.homey.manifest.id,
                    class: this.owner.constructor.name,
                }
            }
        }

        if (this.#isDevice()) {
            log = { ...log, ...{ metadata: { deviceId: this.getData().id, deviceName: this.getName(), } } }
        }

        if (this.homey.manifest.id === "org.cflat-inc.telemetryCollector") {
            this.homey.app.addLog(log)
        } else {
            // await AppApi.getInstance(this.homey).addLog(log)
        }

        if (log.level === 'notice' || log.level === 'info' || log.level === 'debug') {
            if (process.env.DEBUG === '1') {
                this.log(`[${log.level.toUpperCase()}] ${this.#isDevice() ? `${this.getName()} > ${log.message}` : log.message}`);
            } else if (log.level === 'info') {
                this.log(log.message);
            }
        } else {
            if (process.env.DEBUG === '1') {
                this.error(`[${log.level.toUpperCase()}] ${this.#isDevice() ? `${this.getName()} > ${log.message}` : log.message}`);
            } else if (log.level === 'error') {
                this.error(log.message);
            }
        }
    }

    #isDevice() {
        // Trick77 - Test if the method "this.getName()" exists, then it's a device !!
        return 'getName' in this
    }
}