Nexia-thermostat-api
=========
An api to control nexia thermostats


Usage
=====

```js
var nexiaApi = require('@cliss/nexia-api');
const activation_code = 1234567890; // Your code here; see below.
let auth = {
  mobile_id: 1234567,
  api_key: '1234567890abcdef1234567890abcde'
};

nexiaApi.getHouse().then(function (houseResult) {
  const thermostats = nexiaApi.getThermostats();

  thermostats.forEach(thermostat => {
    const values = nexiaApi.getThermostatState(thermostat);
    console.log(values.name + 
      ": " + values.heat +
       "º → [" + values.temp + "º; " + values.status + "; " + values.mode.toUpperCase() + "] → " + 
       values.cool + "º");
  });
});
```

Will output:

```
Downstairs: 70º → [70º; Waiting...; HEAT] → 76º
Upstairs: 69º → [69º; Heating; AUTO] → 75º
```

Activation
==========

To get the mobile ID and the api key you have to do the following:

1) Login to mynexia.com
2) Go the to Mobile tab
3) Create a new mobile device
4) Click the Get Activation code button for the new mobile device
5) Make a call to `NexiaApi.connect(activation_code)` and log the output

```js
const nexiaApi = require('nexia-api');

const activation_code = 12345;  // get this from the web ui by following directions above

nexiaApi.connect(activation_code).then((api) => {
  console.log(api);
}).catch((e) => {
  console.error(e);
});
```
