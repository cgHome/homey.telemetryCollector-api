'use strict';

const Homey = require('homey');

module.exports = class appApi extends Homey.SimpleClass {
    // Singleton
    static getInstance(...args) {
        if (!this.instance) {
            this.instance = new this(...args);
            this.instance.logDebug('Singleton created');
        }
        return this.instance;
    }

    static isConnected() {
        return this.instance && this.instance.isConnected();
    }

    #connected = false;
    #telemetryCollectorApi = null;
    #getQueue = [];
    #putQueue = [];

    constructor(homey) {
        super(homey);

        this.homey = homey;

        // Homey events
        this.homey
            .on('unload', this.#disconnect.bind(this));

        // telemetryCollectorApi
        this.#telemetryCollectorApi = this.homey.api.getApiApp('org.cflat-inc.telemetryCollector');
        this.#telemetryCollectorApi
            .on('install', this.#onInstall.bind(this))
            .on('uninstall', this.#onUninstall.bind(this))
            .on('realtime', this.#onRealtime.bind(this));

        this.#connect();
    }

    #onInstall(result) {
        this.logDebug('onInstall()');

        this.homey.setTimeout(() => {
            this.#connect();
        }, 1000); // Wait 1 sec. until app is ready
    }

    #onUninstall() {
        this.logDebug('onUninstall()');
        this.#disconnect();
    }

    #onRealtime(event, data) {
        // this.logDebug(`onRealtime() > event: ${event} data: ${Array.isArray(data) ? JSON.stringify(data) : data}`);
        this.emit(event, data);
    }

    async #connect() {
        if (this.isConnected()) return;

        this.logDebug('connect()');
        if (await this.#telemetryCollectorApi.getInstalled()) {
            this.#connected = true;
        } else {
            this.homey.notifications.createNotification({
                excerpt: `The ${this.homey.manifest.name.en || this.homey.manifest.name} App is **Simple(Sys)Log ready**. \n (If you install the App, the log messages will be displayed there.)`,
            }).catch((error) => this.logError(`#connect() > ${error}`));
        }
    }

    async #disconnect() {
        if (!this.isConnected()) return;

        this.logDebug('disconnect()');
        this.#telemetryCollectorApi.unregister();
        this.#connected = false;
    }

    sendLog(log) {

    }
}