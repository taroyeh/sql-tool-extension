(function() {
    // Write global variable: extensionBaseUrl
    var newScript = document.createElement("script");
    var inlineScript = document.createTextNode("var extensionBaseUrl = '" + chrome.extension.getURL("") + "';");
    newScript.appendChild(inlineScript); 
    (document.head || document.documentElement).appendChild(newScript);

    // Inject scripts
    var loaded = [];
    var scripts = [
        "codemirror-sql/codemirror.js",
        "codemirror-sql/mirrorframe.js"
    ];
    for (var i = 0; i < scripts.length; i++) {
        loadScript(scripts[i]);
    }

    var timer = setInterval(function() {
        if (loaded.length == scripts.length) {
            loadScript("main.js");
            clearInterval(timer);
        }
    }, 100);

    function loadScript(path) {
        var e = document.createElement('script');
        (document.head || document.documentElement).appendChild(e);
        e.src = chrome.extension.getURL(path);
        e.onload = function() {
            loaded.push(e);
            this.remove();
        };
    }
})();
