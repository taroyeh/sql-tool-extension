function installExtension(extensionId, options) {
	const itemsPerPage = 50;
	const $frame = $('#frame');
	const $sql = $('#sql');

	let sqlEditor = null;

	//==============================================

	(function main() {
		rerenderControllerRow();
		applyStyle();
		colorfulSql();
		overrideOriginSearch();
		setupF5Exexute();
		setupFormatSql();
		setupAutoLoadNextPage();
		setupExportExcel();
		setupHighlightSelectedRow();
		setupAutoUpdateUrl();
		recoverUiFromUrl();
	})();

	//==============================================

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
				this.checkExportExcelButtonVisibility();
			},
			updateData: function(rowCount, pageNumber) {
				data.rowCount = rowCount;
				data.pageNumber = pageNumber;
				if (pageNumber * itemsPerPage >= rowCount) {
					data.done = true;
				}
				$('#resultInfo').html(`
					<span><b>Count: </b> ${rowCount} </span>
					<span><b>Page loaded: </b> ${pageNumber} / ${Math.ceil(rowCount / itemsPerPage)} </span>
				`);
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
				$frame.append(`<center class="loadingPlaceholder"><img src="${$page.imagePath}/loading-1.gif"/></center>`);
			},
			endLoading: function() {
				$('.loadingPlaceholder').remove();
				clearInterval(intervalControl);
				hideScreen();
				timeEnd();
				data.loading = false;
			},
			clearFrame: function() {
				$frame.empty();
				$("#resultInfo").empty();
			},
			checkExportExcelButtonVisibility: function() {
				if (this.canExportExcel()) {
					$("#btnExportExcel").show();
				} else {
					$("#btnExportExcel").hide();
				}
			}
		};
	})();

	//==============================================

	function rerenderControllerRow() {
		const $originRow = $('.tableStyle tbody tr:first');
		const $tr = $('<tr></tr>');
		$tr.append($('<td><b>Server:</b> </td>').append($originRow.find('#dataSouce')));
		$tr.append($('<td></td>').append($originRow.find('#excuteTime')));
		$tr.append($('<td><div id="resultInfo"></div></td>'));
		$tr.append($('<td id="buttonContainer"><input type="button" id="btnQuery" class="generated-button" value="Query"></td>'));
		$('.tableStyle tbody').append($tr);
		$originRow.remove();

		$('#btnQuery').click(function() {
			search("readOnly");
		});
	}

	function applyStyle() {
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
			cssContent += `${setting.selector} { ${setting.property} : #${options[opt]}; } \n`;
		}

		cssContent += ".CodeMirror { font-size: " + options.editor_font_size + "pt; } \n";

		const styleSheet = document.createElement("style");
		styleSheet.appendChild(document.createTextNode(cssContent)); 
		(document.head || document.documentElement).appendChild(styleSheet);
	}

	function colorfulSql() {
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
	}

	function overrideOriginSearch() {
		// Override the outer function
		this.search = function(type) {
			const sqlStr = getSqlFromUi();
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

			updateUrl(data.dataSource, data.sqlStr);

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
				ui.checkExportExcelButtonVisibility();
			});
		}
	}

	function setupF5Exexute() {
		// F5: execute SQL command
		if (options.f5_execute == true) {
			$('#btnQuery').attr('title', 'F5');
			$(document).bind("keydown", function(e) {
				if ((e.which || e.keyCode) == 116) {
					e.preventDefault();
					$('#btnQuery').click();
				}
			});
		}
	}

	function setupFormatSql() {
		// Ctrl + Shift + F: format SQL
		if (options.sql_formatter == true) {
			const formatSqlHandler = function(e) {
				const sqlStr = getSqlFromUi();
				chrome.runtime.sendMessage(extensionId, {method: "formatSql", sql: sqlStr}, function(resp) {
					if (!resp.success) {
						return;
					}
					setSqlToUi(resp.data);
				});
			};
			const $button = $("<input type='button' id='btnFormat' value='Format SQL' title='Ctrl + Shift + F' class='generated-button' />").click(formatSqlHandler);
			$('#btnQuery').before($button);
			$(document).bind("keypress", function(e) {
				if (e.ctrlKey && e.shiftKey && ((e.which || e.keyCode) == 6)) {
					e.preventDefault();
					formatSqlHandler();
				}
			});
		}
	}

	function setupAutoLoadNextPage() {
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
	}

	function setupExportExcel() {

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
		$('#buttonContainer').prepend($btnExportExcel);
	}

	function setupHighlightSelectedRow() {
		// Toggle background color when clicking row 
		$(document).on("click", "table.tableStyle2 tr.data-row td", function() {
			$(this).parent("tr").toggleClass("checked");
		});
	}

	function setupAutoUpdateUrl() {
		if (!options.auto_update_url) {
			return;
		}
		window.onpopstate = function(e) {
			if (e.state) {
				$('#dataSouce').val(e.state.dataSource);
				setSqlToUi(e.state.sql);
			}
		};
	}

	//==============================================

	function getSqlFromUi() {
		return sqlEditor == null ? $sql.val() : sqlEditor.doc.getValue();
	}

	function setSqlToUi(sql) {
		if (sqlEditor == null) {
			$sql.val(sql);
		} else {
			sqlEditor.doc.setValue(sql);
		}
	}

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

	function getUrlParameter(key) {
		const url = window.location.search.substring(1);
		const params = url.split('&');
		for (let i = 0; i < params.length; i++) {
			const vars = params[i].split('=');
			if (vars[0] == key) {
				return vars[1];
			}
		}
		return null;
	}

	function updateUrl(dataSource, sql) {
		if (!options.auto_update_url) {
			return;
		}
		const compressedSql = LZString.compressToEncodedURIComponent(sql);
		const params = `?d=${dataSource}&s=${compressedSql}`;
		window.history.pushState({
			dataSource: dataSource,
			sql: sql
		}, "execute-history", params);
	}

	function recoverUiFromUrl() {
		const dataSource = getUrlParameter('d');
		const compressedSql = getUrlParameter('s');

		if (dataSource) {
			$('#dataSouce').val(dataSource);
		}
		if (compressedSql) {
			const decompressSql = LZString.decompressFromEncodedURIComponent(compressedSql);
			if (decompressSql) {
				setSqlToUi(decompressSql);
			}
		}
	}
}
