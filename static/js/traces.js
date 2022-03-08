var traces = {};
var dynamics = {};
var activeTrace;

var finishProgress = function(type) {
    $("#" + type + "-progress progress").hide();
    $("#" + type + "-progress").append("Done.");
    setTimeout(function() {
        $("#" + type + "-progress").hide();
    }, 8);
};

var timestampHoverHandler = {
    on: function(timestamp, trace) {
        $("#current_timestamp").text(timestamp.toFixed(2)).parent().show();
    },
    off: function() {
        $("#current_timestamp").parent().hide();
    }
};

var updateProgress = function(element, progress) {
    $(element).parent().hide();
    $(element).hide();
    $(element).attr("value", progress);
    $(element).text(progress + "%");
    $(element).parent().show();
    $(element).show();
};

var processTrace = function(selectedTrace, data) {
    var count = 0;
    var lastLoggedProgress = 0;
    var progressElement = $("#analysis-progress progress");
    updateProgress(progressElement, 0);
    _.each(data.split("\n"), function(line, i) {
        if(line) {
            try {
                handleMessage(selectedTrace, JSON.parse(line));
            } catch(e) {
                console.log("Unable to parse " + line + " (" + e + ")");
            }
            count += line.length;
            var progress = count / data.length * 100;
            if(progress >= lastLoggedProgress + 1) {
                updateProgress(progressElement, progress);
                lastLoggedProgress = progress;
            }
        }
    });

    activateTrace(selectedTrace);
    finishProgress("analysis");
};

var activateTrace = function(traceUrl) {
    if(activeTrace) {
        _.each(onTraceUnloadCallbacks, function(callback) {
            callback(activeTrace);
        });
    }

    activeTrace = traces[traceUrl];
    _.each(onTraceLoadCallbacks, function(callback) {
        callback(activeTrace);
    });
};

var loadTrace = function(traceUrl) {
    if(_.has(traces, traceUrl)) {
        activateTrace(traceUrl);
    } else {
        traces[traceUrl] = {url: traceUrl, records: []};
        $.ajax({
            xhr: function() {
                var xhr = window.ActiveXObject ?
                        new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();

                // TODO this is a shim for IE8
                if (xhr.addEventListener) {
                    xhr.addEventListener("progress", function(evt){
                        if(evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            updateProgress($("#download-progress progress"), percentComplete * 100);
                        }
                    }, false);
                }
                return xhr;
            },
            url: traceUrl,
            success: function(data) {
                finishProgress("download");
                setTimeout(function() {
                    processTrace(traceUrl, data);
                }, 8);
            },
            dataType: "text"
        });
    }
};

var handleMessage = function(traceUrl, message) {
    if(!message) {
        return;
    }

    if(!_.has(traces, traceUrl)) {
        traces[traceUrl] = {url: traceUrl, records: []};
    }

    // TODO this assumes we never get the exact same timestamp 2 messages in a
    // row, which I think is a safe assumption because the precision of the
    // timestamps is very high right now
    dynamics.timestamp = message.timestamp;
    dynamics[message.name] = message.value;

    var records = traces[traceUrl].records;
    var dynamicsCopy = $.extend({}, dynamics);
    if(records.length > 0 && dynamics.timestamp - _.last(records).timestamp  < 1) {
        dynamicsCopy.timestamp = _.last(records).timestamp;
        traces[traceUrl].records[records.length - 1] = dynamicsCopy;
    } else {
        traces[traceUrl].records.push(dynamicsCopy);
    }
};

var deg2rad = function(deg) {
    return deg * Math.PI / 180;
};

var gpsDistanceKm = function(first, second) {
    var deltaLat = deg2rad(second.latitude) - deg2rad(first.latitude);
    var deltaLon = deg2rad(second.longitude) - deg2rad(first.longitude);
    var a = Math.pow(Math.sin(deltaLat / 2), 2) +
            Math.cos(deg2rad(first.latitude)) *
            Math.cos(deg2rad(second.latitude)) *
            Math.pow(Math.sin(deltaLon / 2), 2);
    var c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1 - a));
    var distance =  c * MEAN_RADIUS_EARTH_KM;
    return distance;
};

/* If odometer is available, uses that. Otherwise falls back to GPS reading. */
var distanceKm = function(first, second) {
    var odometerAvailable = _.every([first, second], function(record) {
        return record.latitude && record.longitude;
    });
    var distance;
    if(first.odometer && second.odometer) {
        distance = second.odometer - first.odometer;
    } else {
        var gpsAvailable = _.every([first, second], function(record) {
            return record.latitude && record.longitude;
        });

        if(gpsAvailable) {
            distance = gpsDistanceKm(first, second);
        }
    }
    return distance;
};

var kmToMiles = function(km) {
    return km * MILES_PER_KM;
};

var distanceMiles = function(first, second) {
    return kmToMiles(distanceKm(first, second));
};
