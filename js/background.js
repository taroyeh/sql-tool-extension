(function() {
    // DO NOT use directly, you should use cloneDefaultOptions() to get a cloned options
    var defaultOptions = {
        // General
        f5_execute: true,
        auto_load_next_page: true,
        colorful_sql: true,
        show_row_number: true,
        show_cell_title: true,
        editor_font_size: 16,
        // Default SQL
        default_sql: "Keep on working...",
        // Colors
        color_sql_editor_background: "E5F1F4",
        color_sql_editor_border: "C4C9FD",
        color_sql_editor_line_number: "FFFFFF",
        color_sql_editor_line_number_background: "5BAFC7",
        color_result_alternative_row_background: "DAEEF3",
        color_result_mouse_over_row_background: "A2DEE8",
        color_result_selected_row_background: "CFCFCF"
    };

    chrome.runtime.onMessage.addListener(function(request, sender, responseCallback) {
        if (!request || !request.method) {
            return errorResultHandler("Method not found.", responseCallback);
        }
        switch (request.method) {
        case "getDefaultOptions":
            return successResultHandler(cloneDefaultOptions(), responseCallback);
        case "getOptions":
            return getOptionsResponse(responseCallback);
        case "setOptions":
            return setOptionsResponse(request, responseCallback);
        case "getColorCss":
            return getColorCssResponse(responseCallback);
        default:
            return errorResultHandler("Wrong method.", responseCallback);
        }
    });

    // responseCallback = function(response) { ... }
    function successResultHandler(result, responseCallback) {
        var response = {
            success: true,
            message: "",
            data: result
        };
        responseCallback(response);
        return false; // no wait callback
    }

    // responseCallback = function(response) { ... }
    function errorResultHandler(message, responseCallback) {
        var response = {
            success: false,
            message: message,
            data: null
        };
        responseCallback(response);
        return false; // no wait callback
    }

    function cloneDefaultOptions() {
        return Object.assign({}, defaultOptions);
    }

    // callback = function(options) { ... }
    function getOptions(callback) {
        chrome.storage.sync.get(cloneDefaultOptions(), callback);
        return true; // wait callback
    }

    // responseCallback = function(response) { ... }
    function getOptionsResponse(responseCallback) {
        getOptions(function(options) {
            successResultHandler(options, responseCallback);
        });
        return true; // wait callback
    }

    // request = { options: { ... } }
    // responseCallback = function(response) { ... }
    function setOptionsResponse(request, responseCallback) {
        if (!request.options) {
            return errorResultHandler("options not found.", responseCallback);
        }
        chrome.storage.sync.set(request.options, function(options) {
            successResultHandler(options, responseCallback);
        });
        return true; // wait callback
    }

    // responseCallback = function(response) { ... }
    function getColorCssResponse(responseCallback) {
        getOptions(function(options) {
            // TODO: generate css
        });
        return true; // wait callback
    }
})();
