var rp = require('request-promise')
var base_url = "https://www.mynexia.com/mobile/"


NexiaApi = (function () {
    var mobile_id = null
    var api_key = null
    var last_session = null
    var last_house = null

    NexiaApi.prototype.setAuth = function (auth) {
        this.mobile_id = auth.mobile_id
        this.api_key = auth.api_key
    }

    NexiaApi.prototype.post = function (url, json) {
        return rp.post({
            url: base_url + url,
            headers: {'X-MobileId': this.mobile_id, 'X-ApiKey': this.api_key},
            json: json
        })
    }

    NexiaApi.prototype.get = function (url) {
        return rp({
            url: base_url + url,
            headers: {'X-MobileId': this.mobile_id, 'X-ApiKey': this.api_key}
        })
    }


    NexiaApi.prototype.getSession = function () {
        var api = this
        return this.get("session")
            .then(function (data) {
                data = JSON.parse(data)
                api.last_session = data.result
                return data
            })
    }

    NexiaApi.prototype.runMode = function (mode) {
        var zone = this.getThermostat().zones[0]
        return this.post(zone.type + "s/" + zone.id + "/run_mode", {value: mode})
    }

    NexiaApi.prototype.runSchedule = function () {
        this.runMode("run_schedule")
    }

    NexiaApi.prototype.holdTemp = function () {
        this.runMode("permanent_hold")
    }

    //////////////////////////////////////////
    //              THERMOSTAT              //
    //////////////////////////////////////////

    NexiaApi.prototype.getThermostats = function () {
        return this.last_house._links.child[0].data.items[0]._links.child.map(child => child.data)
    }

    NexiaApi.prototype.getThermostat = function (number) {
		var num = 0
		if (number != undefined) {
			num = number
		}
        return this.last_house._links.child[0].data.items[num].data
    }

    NexiaApi.prototype.findThermostatFeature = function(thermostat, featureName) {
        if (thermostat == undefined) {
            return console.error("Must provide a thermostat")
        } else if (featureName == undefined) {
            return console.error("Must provide a feature name")
        }

        const feature = thermostat.features.filter(feature => feature.name == featureName)
        if (feature.length == 0) {
            return console.error('Could not find feature "' + featureName + '"')
        } else if (feature.length > 1) {
            return console.error('Found too many options for features for "' + featureName + '"')
        }
        return feature[0]
    }

    NexiaApi.prototype.getThermostatModelName = function (thermostat) {
        if (thermostat == undefined) {
            return console.error("Must provide a thermostat")
        }

        const feature = this.findThermostatFeature(thermostat, "advanced_info")
        return feature.items.filter(item => item.label == "Model")[0].value

    }

    NexiaApi.prototype.getThermostatState = function(thermostat) {
        return {
            "name": thermostat.name,
            "heat": thermostat.zones[0].setpoints.heat,
            "temp": thermostat.zones[0].temperature,
            "cool": thermostat.zones[0].setpoints.cool,
            "status": thermostat.system_status,
            "mode": thermostat.zones[0].current_zone_mode
        }
    }

    NexiaApi.prototype.setTemperature = function (thermostat, cool, hot) {
        // If we don't have a thermostat, or the
        // thermostat is a number, that's a problem.
        if (thermostat == undefined || !isNaN(thermostat)) {
            return console.error("Cannot set temperature without a target thermostat!")
        }
        
        var out = {}
        if (cool != undefined) {
            out.cool = cool
        }
        if (hot != undefined) {
            out.heat = hot
        }
        var zone = thermostat.zones[0]
        if (isNaN(zone.id)) {
            return console.error("Could not read ID from provided thermostat!")
        }

        //return this.post(zone.type + "s/" + zone.id + "/setpoints", out)
    }

    //////////////////////////////////////////
    //                 HOUSE                //
    //////////////////////////////////////////

    NexiaApi.prototype.getHouseId = function () {
        return this.last_session._links.child[0].data.id
    }

    NexiaApi.prototype.getHouse = function () {
        var api = this
        if (this.last_session == null) {
            return this.getSession()
                .then(function () {
                    return api.getHouse()
                })
        }
        return this.get("houses/" + this.getHouseId())
            .then(function (data) {
                data = JSON.parse(data)
                api.last_house = data.result
                return data
            })
    }

    NexiaApi.prototype.getSystemStatus = function(thermostat) {
        const status = thermostat.zones[0].features[0].status
        if (status == "System Idle") {
            return "Idle"
        } else if (status == "Heating") {
            return "Heating"
        } else if (status == "Cooling") {
            return "Cooling"
        }

        return undefined
    }


    NexiaApi.prototype.connect = function (activation_code) {
        var api = this
        return rp.post({url: base_url + "activate", json: {"activation_code": activation_code}})
            .then(function (data) {
                api.mobile_id = data.result.mobile_id
                api.api_key = data.result.api_key
                return api
            })
    }
})

module.exports = new NexiaApi()
