(function() {
    var colorpickers = [];

    $("#tabs").tabs();

    $("button").button();

    $("button.hidden").click(function(e) {
        // Do nothing.
        // Since the first button inside the form will be triggered the click event when pressing ENTER key,
        // so we put a hidden dummy button to capture the strange situation and then do nothing.
        e.preventDefault();
    });

    $("#btnReset").click(function(e) {
        e.preventDefault();
        $("#fmOptions")[0].reset();
        for (var i = 0; i < colorpickers.length; i++) {
            var $colorpicker = colorpickers[i];
            $colorpicker.colorpicker("setColor", $colorpicker[0].value);
        }
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
            if (!resp.success) {
                return;
            }
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
            return;
        }
        setOptionsFields(resp.data);
        setColorPicker();
    });

    function setOptionsFields(options) {
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

            $this.attr("value", options[name]);
        });
    }

    function setColorPicker() {
        $(".color-item").each(function() {
            var $colorItem = $(this);
            var $colorpicker = $colorItem.find(".text").colorpicker({
                parts: ["map", "bar"],
                layout: {
                    // Left, Top, Width, Height (in table cells).
                    map: [0, 0, 1, 1],
                    bar: [1, 0, 1, 1]
                },
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                altField: $colorItem.find(".display"),
                altProperties: "background-color"
            });
            colorpickers.push($colorpicker);
        });
    }
})();
