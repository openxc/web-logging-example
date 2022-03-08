var gearHistogramHoverHandler = {
    on: function(timestamp, trace) {
        var gear;
        if(timestamp < trace["gear_timeseries"][0].start) {
            gear = trace["gear_timeseries"][0];
        } else if(timestamp > _.last(trace["gear_timeseries"]).end) {
            gear = _.last(trace["gear_timeseries"]);
        } else {
            gear = _.find(trace["gear_timeseries"], function(gearPeriod) {
                return timestamp >= gearPeriod.start && timestamp <= gearPeriod.end;
            });
        }

        if(gear) {
            $("#current_gear_position").text(gear.gear).parent().show();
        }
    },
    off: function() {
        $("#current_gear_position").parent().hide();
    }
}

var drawGearHistogram = function(trace) {
    var element = $("#gear-histogram").get(0);
    if(!element.getContext) {
        console.log("No <canvas> element available, not drawing histogram");
        return;
    }
    var context = element.getContext("2d");

    var gearDuration = {first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0};
    var gearTimeseries = [];
    var recordsWithGear = _.filter(trace.records, function(record) {
        return !!record.transmission_gear_position
    });

    var lastGearChange = undefined;
    _.each(recordsWithGear, function(record) {
        if(!_.has(gearDuration, record.transmission_gear_position)) {
            gearDuration[record.transmission_gear_position] = 0;
        }

        lastGearChange = lastGearChange || record;

        gearDuration[lastGearChange.transmission_gear_position] += (
                record.timestamp - lastGearChange.timestamp);
        gearTimeseries.push({
                start: lastGearChange.timestamp,
                end: record.timestamp,
                gear: lastGearChange.transmission_gear_position});
        lastGearChange = record;
    });

    trace["gear_timeseries"] = gearTimeseries;
    var totalDuration = _.last(trace.records).timestamp -
            _.first(trace.records).timestamp;
    var data = {
        labels: _.keys(gearDuration),
        datasets : [{data: _.map(gearDuration,
                function(value) {
                    return value / totalDuration * 100;
            })}]
    };

    var chart = new Chart(context).Bar(data, {scaleLabel : "<%=value%>%"});
}
