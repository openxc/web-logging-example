function TraceMap(map) {
    this.map = map;
    this.marker = new google.maps.Marker({
        position: map.getCenter(),
        map: map
    });

    this.track = new google.maps.Polyline({
        path: [],
        strokeColor: "#ff0000",
        strokeWidth: 5,
        map: map
    });
    this.path = this.track.getPath();
}

TraceMap.prototype.addPoint = function(point) {
    this.path.push(point);
    this.centerAndZoom(this.map, this.path);
}

TraceMap.prototype.centerAndZoom = function(map, path) {
    var minLatitude = undefined;
    var maxLatitude = undefined;
    var minLongitude = undefined;
    var maxLongitude = undefined;

    path.forEach(function(point) {
        var lat = point.lat();
        var lon = point.lng();

        if(minLatitude === undefined) {
            minLatitude = lat;
        }

        if(maxLatitude === undefined) {
            maxLatitude = lat;
        }

        if(minLongitude === undefined) {
            minLongitude = lon;
        }

        if(maxLongitude === undefined) {
            maxLongitude = lon;
        }

        if(lon < minLongitude) minLongitude = lon;
        if(lon > maxLongitude) maxLongitude = lon;
        if(lat < minLatitude) minLatitude = lat;
        if(lat > maxLatitude) maxLatitude = lat;
    });

    if(minLatitude === undefined || maxLatitude === undefined
            || minLongitude === undefined || maxLongitude === undefined) {
        return;
    }

    var centerLongitude = (maxLongitude + minLongitude) / 2;
    var centerLatitude = (maxLatitude + minLatitude) / 2;

    map.setCenter(new google.maps.LatLng(centerLatitude, centerLongitude));
    map.fitBounds(new google.maps.LatLngBounds(
            new google.maps.LatLng(minLatitude - .001, minLongitude - .001),
            new google.maps.LatLng(maxLatitude + .001, maxLongitude + .001)));
}

function createMap() {
    var mapOptions = {
        zoom: 4,
        center: new google.maps.LatLng(42.292286,-83.240951),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    if($("#map").length) {
        var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);
        return new TraceMap(map);
    }
}

function shouldShift(series) {
    return series.data.length >= 100;
}

function openWebsocket(chart, map) {
    var ws = new WebSocket("ws://" + document.domain + ":5000/records.ws");
    ws.onmessage = function (theEvent) {
        var data = $.parseJSON(theEvent.data);
        $.each(data.records, function(i, record) {
            if(record.name === "fuel_consumed_since_restart") {
                chart.series[0].addPoint([record.timestamp, record.value], false,
                    shouldShift(chart.series[0]));
            } else if(record.name === "vehicle_speed") {
                chart.series[1].addPoint([record.timestamp, record.value], false,
                    shouldShift(chart.series[1]));
            } else if(record.name === "latitude") {
                arguments.callee.latitude = record.value;
            } else if(record.name === "longitude") {
                arguments.callee.longitude = record.value;
            } else if(record.name === "windshield_wiper_status") {
                var wiperText;
                if(record.value) {
                    wiperText = "on";
                } else {
                    wiperText = "off";
                }
                $("#wiper-status").text(wiperText);
            } else if(record.name === "transmission_gear_position") {
                $("#transmission-gear").text(record.value);
            }

            if(arguments.callee.latitude != undefined
                && arguments.callee.longitude != undefined) {
                var coordinates = new google.maps.LatLng(
                    arguments.callee.latitude,
                    arguments.callee.longitude);
                map.addPoint(coordinates);
                map.marker.setPosition(coordinates);
                arguments.callee.latitude = arguments.callee.longitude = undefined;
            }
        });
    };
}

$(document).ready(function() {
    var fuelColor = "#FF7C00";
    var speedColor = "#37B6CE";
    var options = {
        chart: {
            renderTo: 'chart',
            animation: {
                enabled: false
            }
        },
        legend: {
            enabled: false
        },
        title: {
           text: "Fuel Consumption and Speed"
        },
        xAxis: {
           type: 'datetime',
           gridLineWidth: 1,
           labels: {
              align: 'left',
              x: 3,
              y: -3,
              formatter: function() {
                  return Highcharts.dateFormat('%I:%M:%S', this.value);
              }
           }
        },
        yAxis: [
            {
                title: {
                    text: "Speed",
                    style: {
                        color: speedColor
                    }
                },
                labels: {
                   align: 'left',
                   x: 3,
                   y: 16,
                   formatter: function() {
                       return Highcharts.numberFormat(this.value, 0) + " kph";
                   },
                   style: {
                       color: speedColor,
                   }
                },
                showFirstLabel: false
            },
            {
                title: {
                    text: "Fuel Consumed",
                    style: {
                        color: fuelColor
                    }
                },
                labels: {
                   align: 'left',
                   x: 3,
                   y: 16,
                   formatter: function() {
                      return this.value + " L";
                   },
                   style: {
                       color: fuelColor,
                   }
                },
                opposite: true,
                showFirstLabel: false
            }
        ],
        tooltip: {
           shared: true,
           crosshairs: true
        },
        plotOptions: {
           series: {
              marker: {
                  enabled: false
              }
           },
           line: {
              marker: {
                  enabled: false
              }
           }
        }
    }

    options.series = [];
    options.series.push({name: "Fuel Consumption",
        lineWidth: 4,
        color: fuelColor,
        yAxis: 1,
        market: {
            radius: 4
        },
        data: []});
    options.series.push({name: "Speed",
        lineWidth: 4,
        color: speedColor,
        yAxis: 0,
        market: {
            radius: 4
        },
        data: []});

    var chart = new Highcharts.Chart(options);
    window.setInterval(chart.redraw, 2000);
    openWebsocket(chart, createMap());
});
