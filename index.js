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

    NexiaApi.prototype.setpoints = function (thermostat, cool, hot) {
        var out = {}
        if (cool != undefined) {
            out.cool = cool
        }
        if (hot != undefined) {
            out.heat = hot
        }
        var zone = thermostat.zones[0]
		console.log(JSON.stringify(zone))

        return this.post(zone.type + "s/" + zone.id + "/setpoints", out)
    }

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
	
    NexiaApi.prototype.getThermostats = function (number) {
        return this.last_house._links.child[0].data.items
    }

    NexiaApi.prototype.getThermostat = function (number) {
		var num = 0
		if (number != undefined) {
			num = number
		}
        return this.last_house._links.child[0].data.items[num]
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
