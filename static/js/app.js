var onTraceLoadCallbacks = [];
var onTraceUnloadCallbacks = [];
var hoverHandlers = [];

// TODO no steady step in the graphs, so we can ball park it or brute force
// TODO is this zipped data available through the graph?
var findClosestToX = function(targetX, dataX, dataY) {
    return _.find(_.zip(dataX, dataY), function(element) {
        return element[0] > targetX - 1 && element[0] < targetX + 1;
    });
};

var handleMouseOutGraph = function(event) {
    _.each(hoverHandlers, function(handler) {
        handler.off();
    });
};

var handleMouseOverGraph = function(event, trace, graph) {
    var mouseX = event.pageX - graph.dimensions.xOffset;
    var mouseY = event.pageY - graph.dimensions.yOffset;

    if(mouseX >= 0 && mouseX <= graph.dimensions.width && mouseY >= 0 &&
            mouseY <= graph.dimensions.height) {
        var hoveredTimestamp = graph.x.invert(mouseX);

        _.each(hoverHandlers, function(handler) {
            handler.on(hoveredTimestamp, trace, mouseX, mouseY);
        });
    } else {
        handleMouseOutGraph(event);
    }
};

var traceStatusHandler = {
    onLoad: function() {
        $("#trace-status i").show();
        $("#trace-status span").hide();
    },
    onUnload: function() {
        $("#trace-status i").hide();
        $("#trace-status span").show();
    }
};

$(document).ready(function() {
    map = L.map('map', {zoom: 10});
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 16
    }).addTo(map);


    onTraceLoadCallbacks.push(traceStatusHandler.onLoad);
    onTraceLoadCallbacks.push(timeseriesHandler.onLoad);
    onTraceLoadCallbacks.push(mapRenderHandler.onLoad);
    onTraceLoadCallbacks.push(updateFuelSummary);
    onTraceLoadCallbacks.push(calculateCumulativeFuelEfficiency);
    onTraceLoadCallbacks.push(drawGearHistogram);

    onTraceUnloadCallbacks.push(traceStatusHandler.onUnload);
    onTraceUnloadCallbacks.push(timeseriesHandler.onUnload);
    onTraceUnloadCallbacks.push(mapRenderHandler.onUnload);

    hoverHandlers.push(timeseriesHoverHandler);
    hoverHandlers.push(mapHoverHandler);
    hoverHandlers.push(gearHistogramHoverHandler);
    hoverHandlers.push(timestampHoverHandler);

    $("#traces").change(function(event) {
        traceStatusHandler.onUnload();
        loadTrace($("#traces option:selected").val());
        return false;
    }).change();
});
