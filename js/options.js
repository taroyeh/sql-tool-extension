(function() {
	const colorpickers = [];

	$("#tabs").tabs();

	$("button").button();

	$("button.hidden").click(function(e) {
		// Do nothing.
		// Since the first button inside the form will be triggered the click event when pressing ENTER key,
		// so we put a hidden dummy button to capture the strange situation and then do nothing.
		e.preventDefault();
	});

	$("#btnLoadDefault").click(function(e) {
		e.preventDefault();
		chrome.runtime.sendMessage({method: "getDefaultOptions"}, function(resp) {
			if (!resp.success) {
				return;
			}
			const defaultOptions = resp.data;
			const sectionOptions = {};

			$("#tabs div.ui-tabs-panel[aria-hidden='false'] .options-field").each(function() {
				const $field = $(this);
				const fieldName = $field.prop("name");
				sectionOptions[fieldName] = defaultOptions[fieldName];
			});
			setOptionsFieldsValue(sectionOptions);

			for (let i = 0; i < colorpickers.length; i++) {
				const $colorpicker = colorpickers[i];
				$colorpicker.colorpicker("setColor", $colorpicker.val());
			}

			const $divMessage = $("#divMessage");
			$divMessage.text("The new options doesn't apply until you click the Save button.");
			setTimeout(function() {
				$divMessage.text("");
			}, 2000);
		});
	});

	$("#btnReset").click(function(e) {
		e.preventDefault();
		$("#fmOptions")[0].reset();
		for (let i = 0; i < colorpickers.length; i++) {
			const $colorpicker = colorpickers[i];
			$colorpicker.colorpicker("setColor", $colorpicker[0].value);
		}
	});

	$("#btnSave").click(function(e) {
		e.preventDefault();

		const options = {};
		$(".options-field").each(function() {
			const $this = $(this);
			const name = $this.prop("name");
			if ($this.prop("type").toLowerCase() == "checkbox") {
				options[name] = $this.is(":checked");
			} else if ($this.prop("type").toLowerCase() == "number") {
				options[name] = parseInt($this.val());
			} else {
				options[name] = $this.val();
			}
		});

		chrome.runtime.sendMessage({method: "setOptions", options: options}, function(resp) {
			if (!resp.success) {
				return;
			}
			const $divMessage = $("#divMessage");
			$divMessage.text("Options saved.");
			setOptionsFieldsAsDefault(options);
			setTimeout(function() {
				$divMessage.text("");
			}, 2000);
		});
	});

	chrome.runtime.sendMessage({method: "getOptions"}, function(resp) {
		if (!resp.success) {
			return;
		}
		setOptionsFieldsAsDefault(resp.data);
		setColorPicker();
	});

	function setOptionsFieldsAsDefault(options) {
		$(".options-field").each(function() {
			const $this = $(this);
			const name = $this.prop("name");

			if (!options.hasOwnProperty(name)) {
				return;
			}
			const value = options[name];

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
					const $option = $(this);
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

	function setOptionsFieldsValue(options) {
		$(".options-field").each(function() {
			const $this = $(this);
			const name = $this.prop("name");

			if (!options.hasOwnProperty(name)) {
				return;
			}
			const value = options[name];

			if ($this.prop("type").toLowerCase() == "checkbox") {
				$this.prop("checked", value);
				return;
			}

			$this.val(options[name]);
		});
	}

	function setColorPicker() {
		$(".color-item").each(function() {
			const $colorItem = $(this);
			const $colorpicker = $colorItem.find(".text").colorpicker({
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
