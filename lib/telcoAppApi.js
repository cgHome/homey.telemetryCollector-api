'use strict';

const Homey = require('homey');

const QUEUE_MAX = 100;

module.exports = class TelCoAppApi extends Homey.SimpleClass {
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

  #prevLevel = '';
  #prevMessage = '';
  #prevDate = Date.now();

  #appApi = null;
  #connected = false;
  #getQueue = [];
  #putQueue = [];

  constructor(homey) {
    super(homey);

    this.homey = homey;

    // Homey events
    this.homey
      .on('unload', this.#disconnect.bind(this));


    this.#appApi = this.homey.api.getApiApp('org.cflat-inc.telemetryCollector');
    this.#appApi
      .on('install', this.#onInstall.bind(this))
      .on('uninstall', this.#onUninstall.bind(this))
      .on('realtime', this.#onRealtime.bind(this));

    this.#connect();
  }

  #onInstall(result) {
    this.logDebug('onInstall received');

    this.homey.setTimeout(() => {
      this.#connect();
    }, 1000); // Wait 1 sec. until app is ready
  }

  #onUninstall() {
    this.logDebug('onUninstall received');
    this.#disconnect();
  }

  #onRealtime(event, data) {
    // this.logDebug(`onRealtime() > event: ${event} data: ${Array.isArray(data) ? JSON.stringify(data) : data}`);
    this.emit(event, data);
  }

  async #connect() {
    if (this.isConnected()) return;

    await this.#appApi.getInstalled()
      .then(async (isInstalled) => {
        if (!isInstalled) return

        this.logDebug('AppApi installed');
        this.#connected = true;
        await this.#handleGetQueue();
        await this.#handlePutQueue();

      })
      .catch((err) => this.logError(err));
  }

  async #disconnect() {
    if (!this.isConnected()) return;

    this.logDebug('AppApi disconnected');
    this.#appApi.unregister();
    this.#connected = false;

  }

  // myApi

  logError(msg) {
    // Only for internal test (& this.error doesn't work)
    // this.homey.app.error(`${this.constructor.name} > ${msg}`);
  }

  logDebug(msg) {
    // Only for internal test (& this.log doesn't work)
    // this.homey.app.log(`[DEBUG] ${this.constructor.name} > ${msg}`);
  }

  isConnected() {
    return this.#connected;
  }

  async get(uri) {
    if (this.#getQueue.length < QUEUE_MAX) {
      await this.#getQueue.push(uri);
      await this.#handleGetQueue();
    }
  }

  async #handleGetQueue() {
    while (this.isConnected() && this.#getQueue.length > 0) {
      const uri = this.#getQueue.shift();
      this.logDebug(`get() > uri: "${uri}"`);
      await this.#appApi.get(uri)
        .catch((error) => this.logError(`get() > ${error}`));
    }
  }

  async put(uri, data) {
    // Send the same message only once in a row.
    if (data.level === this.#prevLevel && data.message === this.#prevMessage && (Date.now() - this.#prevDate) <= (10 * 1000)) return
    this.#prevDate = Date.now();
    this.#prevLevel = data.level;
    this.#prevMessage = data.message;

    if (this.#putQueue.length < QUEUE_MAX) {
      await this.#putQueue.push({ uri, body: data });
      await this.#handlePutQueue();
    }
  }

  async #handlePutQueue() {
    while (this.isConnected() && this.#putQueue.length > 0) {
      const item = this.#putQueue.shift();
      this.logDebug(`put() > uri: "${item.uri}", body: ${JSON.stringify(item.body)}`);
      await this.#appApi.put(item.uri, item.body)
        .catch((error) => this.logError(`put() > ${error}`));
    }
  }
}