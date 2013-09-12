if (!document.createElementNS) {
    document.createElementNS = function(ns, name) {
        // TODO the shim from aight throws an exception is a namespace is passed,
        // which makes d3 explode - I don't really get the point of a shim if
        // it's going to do that
        return document.createElement(name);
    };
}
