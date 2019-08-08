(function() {
    // Inject styles
    const styles = [
        "libs/jquery-ui/jquery-ui.min.css",
        "libs/codemirror/lib/codemirror.css",
        "libs/codemirror/addon/hint/show-hint.css",
        "css/sqlcolors.css",
        "css/extension.css"
    ];
    for (let i = 0; i < styles.length; i++) {
        loadStyle(styles[i]);
    }

    // Inject scripts
    const loaded = [];
    const scripts = [
        "libs/jquery/jquery-1.12.4.min.js",
        "libs/jquery-ui/jquery-ui.min.js",
        "libs/codemirror/lib/codemirror.js",
        "libs/codemirror/mode/sql/sql.js",
        "libs/codemirror/addon/hint/show-hint.js",
        "libs/codemirror/addon/hint/sql-hint.js",
        "libs/cm-resize/cm-resize.js",
        "js/extension.js"
    ];
    loadScriptOneByOne(scripts, function() { // finishedHandler
        chrome.runtime.sendMessage({method: "getOptions"}, function(resp) {
            if (!resp.success) {
                return;
            }
            install(resp.data);
        });
    });

    function loadScript(path) {
        const e = document.createElement("script");
        (document.head || document.documentElement).appendChild(e);
        e.src = chrome.extension.getURL(path);
        e.onload = function() {
            loaded.push(e);
            this.remove();
        };
    }

    function loadStyle(path) {
        const e = document.createElement("link");
        (document.head || document.documentElement).appendChild(e);
        e.href = chrome.extension.getURL(path);
        e.rel = "stylesheet";
        e.type = "text/css";
    }

    function loadScriptOneByOne(scripts, finishedHandler) {
        let index = -1;
        const timer = setInterval(function() {
            if (loaded.length == scripts.length) {
                clearInterval(timer);
                finishedHandler();
                return;
            }
            if (loaded.length > index && loaded.length < scripts.length) {
                loadScript(scripts[++index]);
            }
        }, 20);
    }

    function install(options) {
        const newScript = document.createElement("script");
        const inlineScript = document.createTextNode(
            'installExtension("' + chrome.runtime.id + '", ' + JSON.stringify(options) + ');'
        );
        newScript.appendChild(inlineScript); 
        (document.head || document.documentElement).appendChild(newScript);
        newScript.remove();
    }
})();
