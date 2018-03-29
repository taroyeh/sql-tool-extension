(function() {
    // Inject styles
    var styles = [
        "css/extension.css"
    ];
    for (var i = 0; i < styles.length; i++) {
        loadStyle(styles[i]);
    }

    // Inject scripts
    var loaded = [];
    var scripts = [
        "libs/jquery/jquery-1.12.4.min.js",
        "libs/codemirror/codemirror.js",
        "libs/codemirror/mirrorframe.js",
        "js/extension.js"
    ];
    for (var i = 0; i < scripts.length; i++) {
        loadScript(scripts[i]);
    }

    // Wait all scripts registered, then fetch options and install extension
    var timer = setInterval(function() {
        if (loaded.length == scripts.length) {
            clearInterval(timer);
            chrome.runtime.sendMessage({method: "getOptions"}, function(resp) {
                if (!resp.success) {
                    return;
                }
                install(resp.data);
            });
        }
    }, 20);

    function loadScript(path) {
        var e = document.createElement("script");
        (document.head || document.documentElement).appendChild(e);
        e.src = chrome.extension.getURL(path);
        e.onload = function() {
            loaded.push(e);
            this.remove();
        };
    }

    function loadStyle(path) {
        var e = document.createElement("link");
        (document.head || document.documentElement).appendChild(e);
        e.href = chrome.extension.getURL(path);
        e.rel = "stylesheet";
        e.type = "text/css";
    }

    function install(options) {
        var newScript = document.createElement("script");
        var inlineScript = document.createTextNode(
            'installExtension("' + chrome.runtime.id + '", ' + JSON.stringify(options) + ');'
        );
        newScript.appendChild(inlineScript); 
        (document.head || document.documentElement).appendChild(newScript);
        newScript.remove();
    }
})();
