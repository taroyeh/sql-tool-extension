(function() {
    $("#tabs").tabs().css({
       "min-height": "348px",
       "overflow": "auto"
    });

    $("button").button();

    $("#btnReset").click(function(e) {
        e.preventDefault();
        $("#fmOptions")[0].reset();
    });

    $("#btnSave").click(function(e) {
        e.preventDefault();

        var options = {};
        $(".options-field").each(function() {
            var $this = $(this);
            var name = $this.prop("name");
            if ($this.prop("type").toLowerCase() == "checkbox") {
                options[name] = $this.is(":checked");
            } else {
                options[name] = $this.val();
            }
        });

        chrome.runtime.sendMessage({method: "setOptions", options: options}, function(resp) {
            console.log("options set");
            var $divMessage = $("#divMessage");
            $divMessage.text("Options saved.");
            setOptionsFields(options);
            setTimeout(function() {
                $divMessage.text("");
            }, 1000);
        });
    });

    chrome.runtime.sendMessage({method: "getOptions"}, function(resp) {
        if (!resp.success) {
            console.log(resp.message);
            return;
        }
        setOptionsFields(resp.data);
    });

    function setOptionsFields(options) {
        console.log("options gotten");
        console.log(options);
        $(".options-field").each(function() {
            var $this = $(this);
            var name = $this.prop("name");

            if (!options.hasOwnProperty(name)) {
                return;
            }
            var value = options[name];

            if ($this.prop("type").toLowerCase() == "checkbox") {
                if (value) {
                    $this.attr("checked", "checked");
                } else {
                    $this.removeAttr("checked");
                }
                return;
            }

            if ($this.prop("tagName").toLowerCase() == "select") {
                $this.find("option").each(function() {
                    var $option = $(this);
                    if ($option.val() == value) {
                        $option.attr("selected", "selected");
                    } else {
                        $option.removeAttr("selected");
                    }
                });
                return;
            }

            if ($this.prop("tagName").toLowerCase() == "textarea") {
                $this.prop("innerHTML", value);
                return;
            }

            $this.val(options[name]);
        });
    }
})();
