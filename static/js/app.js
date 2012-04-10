
function loadGPXFileIntoGoogleMap(map, filename) {
    $.ajax({url: filename,
        dataType: "xml",
        success: function(data) {
          var parser = new GPXParser(data, map);
          parser.setTrackColour("#ff0000");     // Set the track line colour
          parser.setTrackWidth(5);          // Set the track line width
          parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
          parser.centerAndZoom(data);
          parser.addTrackpointsToMap();         // Add the trackpoints
          parser.addWaypointsToMap();           // Add the waypoints
        }
    });
}

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

    var fuelColor = "#4572A7";
    var speedColor = "#AA4643";
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
              cursor: 'pointer',
              point: {
                 events: {
                    click: function() {
                       hs.htmlExpand(null, {
                          pageOrigin: {
                             x: this.pageX,
                             y: this.pageY
                          },
                          headingText: this.series.name,
                          maincontentText: Highcharts.dateFormat(
                              '%A, %b %e, %Y', this.x) + ':<br/> ' + this.y +
                              ' visits',
                          width: 200
                       });
                    }
                 }
              },
              marker: {
                 lineWidth: 1
              }
           }
        }
    }

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
    }, 'json');
});
