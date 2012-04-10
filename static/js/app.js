var options = {
    chart: {
       renderTo: 'chart'
    },
    legend: {
        enabled: false
    },
    title: {
       text: 'Fuel Consumption'
    },
    xAxis: {
       type: 'datetime',
       tickInterval: 1800 * 1000, // 30 minutes
       gridLineWidth: 1,
       labels: {
          align: 'left',
          x: 3,
          y: -3
       }
    },
    yAxis: {
       title: {
          text: null
       },
       labels: {
          align: 'left',
          x: 3,
          y: 16,
          formatter: function() {
             return Highcharts.numberFormat(this.value, 0);
          }
       },
       showFirstLabel: false
    },
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
    $.get($("#chart").data('url'), function(data) {
        var series = [];
        $.each(data.records, function(i, record) {
            series.push([record.timestamp, record.value]);
        });

        options.series = [];
        options.series.push({name: "Ford Focus",
            lineWidth: 4,
            market: {
                radius: 4
            },
            data: series});

        chart = new Highcharts.Chart(options);
    }, 'json');
});
