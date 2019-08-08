function installExtension(extensionId, options) {
	const itemsPerPage = 50;
	const $frame = $("#frame");
	const $sql = $("#sql");

	(function applyStyle() {
		const colorStyleMapping = {
			color_sql_editor_background: {
				selector: ".CodeMirror",
				property: "background-color"
			},
			color_sql_editor_border: {
				selector: ".CodeMirror",
				property: "border-color"
			},
			color_sql_editor_line_number: {
				selector: ".CodeMirror-linenumber",
				property: "color"
			},
			color_sql_editor_line_number_background: {
				selector: ".CodeMirror-gutters",
				property: "background-color"
			},
			color_result_alternative_row_background: {
				selector: "table.tableStyle2 tr.data-row:nth-child(odd) td",
				property: "background-color"
			},
			color_result_mouse_over_row_background: {
				selector: "table.tableStyle2 tr.data-row:hover td",
				property: "background-color"
			},
			color_result_selected_row_background: {
				selector: "table.tableStyle2 tr.data-row.checked td",
				property: "background-color"
			}
		};

		let cssContent = "";
		for (let opt in colorStyleMapping) {
			if (!colorStyleMapping.hasOwnProperty(opt)) {
				continue;
			}
			const setting = colorStyleMapping[opt];
			cssContent += setting.selector + " { " + setting.property + " : #" + options[opt] + "; } \n";
		}

		cssContent += ".CodeMirror { font-size: " + options.editor_font_size + "pt; } \n";

		const styleSheet = document.createElement("style");
		styleSheet.appendChild(document.createTextNode(cssContent)); 
		(document.head || document.documentElement).appendChild(styleSheet);
	})();

	let sqlEditor = null;
	if (options.colorful_sql == true) {
		sqlEditor = CodeMirror.fromTextArea($sql[0], {
			mode: "text/x-mssql",
			lineNumbers: true,
			indentWithTabs: true,
			smartIndent: true,
			matchBrackets : true,
			autofocus: true,
			extraKeys: {
				"Ctrl-Space": "autocomplete"
			},
			hintOptions: {
				tables: {
					users: ["name", "score", "birthDate"],
					countries: ["name", "population", "size"]
				}
			}
		});
		cmResize(sqlEditor);
	} else {
		$sql.css({
			fontSize: options.editor_font_size + "pt"
		});
	}

	const ui = (function() {
		let intervalControl = null;
		const data = {
			rowCount: 0,
			pageNumber: 0,
			loading: false,
			done: false
		};
		return {
			resetData: function() {
				data.rowCount = 0;
				data.pageNumber = 0;
				data.loading = false;
				data.done = false;
			},
			updateData: function(rowCount, pageNumber) {
				data.rowCount = rowCount;
				data.pageNumber = pageNumber;
				if (pageNumber * itemsPerPage >= rowCount) {
					data.done = true;
				}
				$("#resultInfo").html(
					"<span><b>Count: </b> " + rowCount + " </span> " + 
					"<span><b>Page loaded: </b> " + pageNumber + " / " + Math.ceil(rowCount / itemsPerPage) + " </span>"
				);
			},
			canLoadMore: function() {
				return !(data.done || data.loading || data.rowCount == 0 || data.pageNumber == 0);
			},
			canExportExcel: function() {
				return data.rowCount > 0;
			},
			startLoading: function() {
				data.loading = true;
				timeStart();
				clearInterval(intervalControl);
				intervalControl = window.setInterval("showScreen();", 120000);
				$frame.append("<center class='loadingPlaceholder'><img src='" + $page.imagePath + "/loading-1.gif'/></center>");
			},
			endLoading: function() {
				$(".loadingPlaceholder").remove();
				clearInterval(intervalControl);
				hideScreen();
				timeEnd();
				data.loading = false;
			},
			clearFrame: function() {
				$frame.html("");
				$("#resultInfo").html("");
			}
		};
	})();

	function ajaxExcuteSql(data, callback) {
		ui.startLoading();
		currentAjax = $.ajax({
			type: "POST",
			url: "executeSql.action",
			timeout: 3600000, // one hour
			data: data,
			dataType: "html",
			success: function(htmlResponse) {
				const $response = handleHtmlResponse(htmlResponse);
				callback($response);
			},
			error: function() {
				alert("server error!");
				ui.clearFrame();
			},
			complete: function() {
				ui.endLoading();
			}
		});
	}

	// Override the outer function
	this.search = function(type) {
		const sqlStr = (sqlEditor == null ? $sql.val() : sqlEditor.doc.getValue());
		if($.trim(sqlStr) == ""){
			alert("Please enter the SQL script!");
			return;
		}

		const data = {
			sqlStr: sqlStr,
			dataSource: $("#dataSouce").val(),
			role: type,
			pageNumber: 1
		};
		$frame.data("data", data);

		ui.resetData();
		ui.clearFrame();

		ajaxExcuteSql(data, function($response) {
			const $table = $response.filter("table");
			if (options.auto_load_next_page == true) {
				$frame.append($table);
			} else {
				$frame.append($response);
			}
			const titles = $table.data("titles");
			const sameTitle = fetchFirstSameTitle(titles);
			if (sameTitle != null) {
				alert("WARNING:\n\n" +
					  "There are some columns with the same name: [" + sameTitle + "].\n\n" +
					  "You should know that there are some bugs occurred when selecting same column names.");
			}
			if (ui.canExportExcel()) {
				$("#btnExportExcel").show();
			} else {
				$("#btnExportExcel").hide();
			}
		});

		function fetchFirstSameTitle(titles) {
			for (let j = 1; j < titles.length; j++) {
				for (let i = 0; i < j; i++) {
					if (titles[i] == titles[j]) {
						return titles[i];
					}
				}
			}
			return null;
		}
	}

	function loadMore() {
		const data = $frame.data("data");
		data.pageNumber++;

		ajaxExcuteSql(data, function($response) {
			const $table = $response.filter("table");
			$frame.find("table").append($table.find("tr"));
		});
	}

	function handleHtmlResponse(htmlResponse) {
		const $response = $(htmlResponse);

		const rowCount = parseInt($($response.filter("#rowCount").val()).text());
		const pageNumber = parseInt($response.filter("#pageNumber").val());
		ui.updateData(rowCount, pageNumber);

		const $table = $response.filter("table");
		let rowId = 0;
		const titles = [];
		$table.find("tr").each(function() {
			const $tr = $(this);
			if (rowId == 0) {
				if (options.show_cell_title == true) {
					$tr.find("th").each(function() {
						titles.push($(this).text());
					});
				}
				if (options.show_row_number == true) {
					$tr.addClass("title-row").prepend("<th>#" + pageNumber + "</th>");
				}
			} else {
				if (options.show_cell_title == true) {
					let t = 0;
					$tr.find("td").each(function() {
						$(this).prop("title", titles[t++]);
					});
				}
				if (options.show_row_number == true) {
					$tr.addClass("data-row").prepend("<td>" + ((pageNumber - 1) * itemsPerPage + rowId) + "</td>");
				}
			}
			rowId++;
		});
		$table.data("titles", titles);

		return $response;
	}

	// F5: execute SQL command
	if (options.f5_execute == true) {
		$(document).bind("keydown", function(e) {
			if ((e.which || e.keyCode) == 116) {
				e.preventDefault();
				search("readOnly");
			}
		});
	}

	// Ctrl + Shift + F: format SQL
	if (options.sql_formatter == true) {
		const formatSqlHandler = function(e) {
			const sqlStr = (sqlEditor == null ? $sql.val() : sqlEditor.doc.getValue());
			chrome.runtime.sendMessage(extensionId, {method: "formatSql", sql: sqlStr}, function(resp) {
				if (!resp.success) {
					return;
				}
				if (sqlEditor == null) {
					$sql.val(resp.data);
				} else {
					sqlEditor.doc.setValue(resp.data);
				}
			});
		};
		const $button = $("<input type='button' id='btnFormat' value=' Format SQL ' title='Ctrl + Shift + F' class='generated-button' />").click(formatSqlHandler);
		$("input[type=button]").each(function() {
			const $this = $(this);
			if ($.trim($this.val()) == "query") {
				$this.before($button).before(" ");
			}
		});
		$(document).bind("keypress", function(e) {
			if (e.ctrlKey && e.shiftKey && ((e.which || e.keyCode) == 6)) {
				e.preventDefault();
				formatSqlHandler();
			}
		});
	}

	// Load more data (next page) when scrolling near bottom of page
	if (options.auto_load_next_page == true) {
		$(window).scroll(function() {
			if($(window).scrollTop() + $(window).height() < $(document).height() - 500) {
				return;
			}
			if (!ui.canLoadMore()) {
				return;
			}
			loadMore();
		});
	}

	// Result info
	$("#excuteTime").after("<div id='resultInfo' style='display: inline-block; padding-left: 10px;'></div>");

	// Toggle background color when clicking row 
	$(document).on("click", "table.tableStyle2 tr.data-row td", function() {
		$(this).parent("tr").toggleClass("checked");
	});

	// Export excel

	const $dlg = $(`
		<div>
			<div>
				<input type='radio' name='exportType' value='0' id='rdoExportAllPage' checked='checked' />
				<label for='rdoExportAllPage'>Export all pages.</label>
			</div>
			<div>
				<input type='radio' name='exportType' value='2' id='rdoExportSpecificPage' />
				<label for='rdoExportSpecificPage'>Export specific pages.</label>
			</div>
			<div style='margin-left: 20px;'>
				<label for='txtStartPage'>From page</label> <input name='startPage' style='width: 30px' id='txtStartPage' />
				<label for='txtEndPage'>to page</label> <input name='endPage' style='width: 30px' id='txtEndPage' />
			</div>
			<div style='margin-top: 10px; color: gray;'>
				Note:<br \>
				The feture can only export the last result in the page.<br \>
				That is to say that the result may be affected by another client (people).
			</div>
		</div>"
	`).dialog({
		title: "Export Excel",
		autoOpen: false,
		minWidth: 350,
		buttons: {
			"Export": function() {
				$dlg.dialog("close");

				const $form = $("<form action='exportXLS.action' method='post'></form>");
				const data = $frame.data("data");
				for (let name in data) {
					if (data.hasOwnProperty(name)) {
						$form.append("<input name='" + name + "' value='" + data[name] + "'>");
					}
				}

				$form.append("<input name='exportType' value='" + $("input[name=exportType]:checked").val() + "'>");
				$form.append("<input name='startPage' value='" + $("#txtStartPage").val() + "'>");
				$form.append("<input name='endPage' value='" + $("#txtEndPage").val() + "'>");
				$form.append("<input name='pageNumber' value='1'>");

				// Avoid Chrome error: Form submission canceled because the form is not connected
				$dlg.append($form);
				$form[0].submit();
				$form.remove();
			}
		}
	});

	const $btnExportExcel = $("<input type='button' id='btnExportExcel' value='Export Excel' class='generated-button' />");
	$btnExportExcel.click(function() {
		$dlg.dialog("open");
	});
	$(".tableStyle tr td:nth-child(2)").empty().append($btnExportExcel);
}
