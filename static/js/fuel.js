var MILES_PER_KM = 0.621371;

var updateGasPrices = function(trace) {
    var gasDistance = 5;
    var apiKey = "rfej9napna";
    var recordWithPosition = _.find(trace.records, function(record) {
        return record.latitude && record.longitude;
    });
    $.ajax({
        url: "http://devapi.mygasfeed.com/stations/radius/" +
            recordWithPosition.latitude + "/" + recordWithPosition.longitude +
            "/" + gasDistance + "/reg/price/" + apiKey + ".json",
        dataType: "jsonp",
        success: function(data) {
            var stations = data["stations"];
            if(stations && stations.length > 0) {
                var stationsWithPrice = _.filter(stations, function(station) {
                    return station.price != "N/A";
                });

                var averagePrice = _.reduce(stationsWithPrice,
                        function(memo, station) {
                            return memo + parseInt(station.price);
                }, 0) / stationsWithPrice.length;

                $("#total-fuel-cost").text(averagePrice *
                    trace.fuelConsumedGallons.toFixed(2)).parent().show();
                $("#average-fuel-cost").text(averagePrice.toFixed(2)).parent().show();
            }
        }
    });
}

var fuelConsumedGallons = function(a, b) {
    var fuelConsumedLiters = b.fuel_consumed_since_restart -
            a.fuel_consumed_since_restart;
    return fuelConsumedLiters * .264172;
}

var calculateFuelConsumedGallons = function(trace) {
    return fuelConsumedGallons(_.first(trace.records), _.last(trace.records));
}

var updateFuelEfficiency = function(trace) {
    trace.overallFuelEfficiency = distanceMiles(_.first(trace.records),
        _.last(trace.records)) / trace.fuelConsumedGallons;
    $("#fuel-efficiency").text(trace.overallFuelEfficiency.toFixed(2)).parent().show();
}

var updateFuelSummary = function(trace) {
    trace.fuelConsumedGallons = calculateFuelConsumedGallons(trace);
    $("#total-fuel-consumed").text(trace.fuelConsumedGallons.toFixed(2)).parent().show();
    updateGasPrices(trace);
    updateFuelEfficiency(trace);
}

var calculateCumulativeFuelEfficiency = function(trace) {
    var brakeEvents = [];
    _.each(trace.records, function(record) {
        // this value could be infinity if we are on electric only power
        record.cumulativeFuelEfficiency =
            distanceMiles(_.first(trace.records), record) /
                fuelConsumedGallons(_.first(trace.records), record);

        if(record.brake_pedal_status) {
            if(brakeEvents.length == 0 || _.last(brakeEvents).end) {
                brakeEvents.push({start: record, end: undefined});
            }
        } else {
            if(brakeEvents.length > 0 && !_.last(brakeEvents).end) {
                _.last(brakeEvents).end = record;
            }
        }
    });

    if(brakeEvents.length > 0 && !_.last(brakeEvents).end) {
        _.last(brakeEvents).end = _.last(trace.records);
    }

    var key = "cumulativeFuelEfficiency";
    graphs[key] = drawTimeseries(trace, key,
        _.pluck(trace.records, "timestamp"), _.pluck(trace.records, key),
        false, true);

    _.each(brakeEvents, function(brakeEvent) {
        var brakeEventGroup = graphs[key].graph.append("svg:svg")
            .attr("class", "brake-event")
            .attr("opacity", ".2");
        var brakeArea = brakeEventGroup.append("svg:rect")
            .attr("x", graphs[key].x(brakeEvent.start.timestamp))
            .attr("width", graphs[key].x(brakeEvent.end.timestamp) -
                    graphs[key].x(brakeEvent.start.timestamp))
            .attr("y", 0)
            .attr("height", graphs[key].dimensions.height);
    });
}
