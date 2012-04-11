function mapper() {
    var center = new google.maps.LatLng(42.292286,-83.240951);
    var mapOptions = {
        zoom: 4,
        center: center,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    if($("#map").length) {
        mapper.mapObject = new google.maps.Map(document.getElementById("map"),
                mapOptions);

        mapper.marker = new google.maps.Marker({
            position: center,
            map: mapper.mapObject
        });

        mapper.track = new google.maps.Polyline({
            path: [center],
            strokeColor: "#ff0000",
            strokeWidth: 5,
            map: mapper.mapObject
        });
        mapper.path = mapper.track.getPath();
    }
}

function shouldShift(series) {
    return series.data.length >= 100;
}

$(document).ready(function() {
    mapper();

    var fuelColor = "#FF7C00";
    var speedColor = "#37B6CE";
    var options = {
        chart: {
            renderTo: 'chart',
            animation: {
                enabled: true,
                easing: "linear"
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
              y: -3
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
                 lineWidth: 1
              }
           }
        }
    }

    var chart;
    $.get($("#chart").data('url'), function(data) {
        var speedSeries = [];
        var fuelSeries = [];
        $.each(data.records, function(i, record) {
            if(record.name == "fuel_consumed_since_restart") {
                fuelSeries.push([record.timestamp, record.value]);
            } else if(record.name == "vehicle_speed") {
                speedSeries.push([record.timestamp, record.value]);
            }
        });

        options.series = [];
        options.series.push({name: "Fuel Consumption",
            lineWidth: 4,
            color: fuelColor,
            yAxis: 1,
            market: {
                radius: 4
            },
            data: fuelSeries});
        options.series.push({name: "Speed",
            lineWidth: 4,
            color: speedColor,
            yAxis: 0,
            market: {
                radius: 4
            },
            data: speedSeries});

        chart = new Highcharts.Chart(options);

        var ws = new WebSocket("ws://" + document.domain + ":5000/records");
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
                }

                if(arguments.callee.latitude != undefined
                    && arguments.callee.longitude != undefined) {
                    var coordinates = new google.maps.LatLng(
                        arguments.callee.latitude,
                        arguments.callee.longitude);
                    mapper.path.push(coordinates);
                    mapper.marker.setPosition(coordinates);
                    arguments.callee.latitude = arguments.callee.longitude = undefined;
                }
            });
            chart.redraw();
        };

    }, 'json');
});
