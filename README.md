# TelemetryCollector Api for developers

Minimal lightweight logging for Homey Apps

This module will be used in a Homey app to send logs to the [TelemetryCollectorApp](https://homey.app/de-ch/app/org.cflat-inc.telemetryCollector).

This module is implemented as a mixin pattern to simplify the use of the interface. (For more information about mixins, see: > Useful Links > Mixins)

---

## Setting it up

### Install

```bash
npm install homey-telemetrycollector-api
```

### Add permission

```json
 "permissions": ["homey:app:org.cflat-inc.telemetryCollector"]
```

### Install TelemetryCollector api

```js
require('homey-telemetrycollector-api').install;
```

### Use it

```js
this.logDebug('So easy it goes');
```

---

## API

**Error:** error conditions

```js
this.logError('logError-Message');
```

**Warning:** warning conditions

```js
this.logWarning('logWarning-Message');
```

**Notice:** normal but significant condition

```js
this.logNotice('logNotice-Message');
```

**Informational:** informational messages

```js
this.logInfo('logInfo-Message');
```

**Debug:** debug-level messages

```js
this.logDebug('logDebug-Message');
```

---

## Code examples

### Homey.App

```js
'use strict';

const Homey = require('homey');

// Install the TelemetryCollector Api
require('homey-telemetrycollector-api').install;

// Development
const inspector = require('node:inspector');

if (process.env.DEBUG === '1') {
  try {
    inspector.waitForDebugger();
  } catch (err) {
    inspector.open(9229, '0.0.0.0', true);
  }
}

module.exports = class TelemetryCollectorApp extends Homey.App {

  async onInit() {

    // ...

    this.logInfo('App has been initialized');
  }

};
```

## Migrations guide

### Preferred

Rename the methods, it's fast (global search & replace), the code is more readable and **the method calls the console message at the end anyway**.

- this.log() > (renameTo) > this.logInfo()
- this.error() > (renameTo) > this.logError()
- this.debug() > (renameTo) > this.logDebug()

---

## Useful Links

### Logging

- [11 Best Practices for Logging in Node.js](https://betterstack.com/community/guides/logging/nodejs-logging-best-practices/)

### Mixins

- [Understanding mixins in javascript](https://basescripts.com/understanding-mixins-in-javascript)

---

## ToDo

-

---

## Thanks

....

---

## Disclaimer

Use at your own risk. I accept no responsibility for any damages caused by using this app.

---

## Copyright

© Chris Gross / [cflat-inc.org](cflat-inc.org), 2025
