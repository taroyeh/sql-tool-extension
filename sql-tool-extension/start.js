(function() {
    // Write global variable: extensionBaseUrl
    var newScript = document.createElement("script");
    var inlineScript = document.createTextNode("var extensionBaseUrl = '" + chrome.extension.getURL("") + "';");
    newScript.appendChild(inlineScript); 
    (document.head || document.documentElement).appendChild(newScript);

    // Execute scripts
    var scripts = [
        "codemirror-sql/codemirror.js",
        "codemirror-sql/mirrorframe.js",
        "main.js"
    ];
    for (var i = 0; i < scripts.length; i++) {
        var e = document.createElement('script');
        e.src = chrome.extension.getURL(scripts[i]);
        e.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(e);
    }
})();
