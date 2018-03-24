(function() {
    // DO NOT use directly, you should use cloneDefaultOptions() to get a cloned options
    var defaultOptions = {
        alternate_color: true,
        colorful_sql: true,
        f5_execute: true,
        highlight_cursor_row: true,
        selectable_row: true,
        show_cell_title: true,
        show_row_number: true,
        editor_font_size: 16
    };

    var messageHandler = function(request, sender, sendResponse) {
        console.log({request: request, sender: sender});
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
    }

    chrome.runtime.onMessage.addListener(messageHandler);
    chrome.runtime.onMessageExternal.addListener(messageHandler);

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
        chrome.storage.sync.set(request.options, callback);
        return true; // wait callback
    }
})();
