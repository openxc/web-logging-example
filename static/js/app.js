function drawMap() {
    var mapOptions = {
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    if($("#map").length) {
        var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);

        var gpxFiles = $("a.gpx").get();
        $.each(gpxFiles, function(i, file) {
            loadGPXFileIntoGoogleMap(map, $(file).attr("href"));
        });
    }
}

$(document).ready(function() {
    drawMap();

    var fuelColor = "#FF7C00";
    var speedColor = "#37B6CE";
    var options = {
        chart: {
           renderTo: 'chart'
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
           },
           spline: {
                dataLabels: {
                enabled: true,
                formatter: function() {
                    // return this.series.name;
                    if (!this.series.inc) this.series.inc = 1;

                    if (this.series.inc >= parseInt(this.series.data.length)) {
                        this.series.inc = 0;
                        return this.point.y;
                    }
                    this.series.inc++;
                }
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
            if(data.name === "fuel_consumed_since_restart") {
                chart.series[0].addPoint([data.timestamp, data.value], true, false);
            }
        };

    }, 'json');
});
