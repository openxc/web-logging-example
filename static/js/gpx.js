$(document).ready(function() {
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
});

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
