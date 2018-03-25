(function() {
    // DO NOT use directly, you should use cloneDefaultOptions() to get a cloned options
    var defaultOptions = {
        f5_execute: true, //
        auto_load_next_page: true, //
        colorful_sql: true, //
        show_row_number: true, //
        alternate_color: true,
        highlight_cursor_row: true,
        selectable_row: true,
        show_cell_title: true, //
        editor_font_size: 16
    };

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (!request || !request.method) {
            return errorResultHandler("Method not found.", sendResponse);
        }
        switch (request.method) {
        case "getDefaultOptions":
            return successResultHandler(cloneDefaultOptions(), sendResponse);
        case "getOptions":
            return getOptions(sendResponse);
        case "setOptions":
            return setOptions(request, sendResponse);
        default:
            return errorResultHandler("Wrong method.", sendResponse);
        }
    });

    function successResultHandler(result, callback) {
        var response = {
            success: true,
            message: "",
            data: result
        };
        callback(response);
        return false; // no wait callback
    }

    function errorResultHandler(message, callback) {
        var response = {
            success: false,
            message: message,
            data: null
        };
        callback(response);
        return false; // no wait callback
    }

    function cloneDefaultOptions() {
        return Object.assign({}, defaultOptions);
    }

    function getOptions(callback) {
        chrome.storage.sync.get(cloneDefaultOptions(), function(options) {
            successResultHandler(options, callback);
        });
        return true; // wait callback
    }

    function setOptions(request, callback) {
        if (!request.options) {
            return errorResultHandler("options not found.", callback);
        }
        chrome.storage.sync.set(request.options, function(options) {
            successResultHandler(options, callback);
        });
        return true; // wait callback
    }
})();
