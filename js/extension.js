function installExtension(extensionId, options) {
    var itemsPerPage = 50;
    var $frame = $("#frame");
    var $sql = $("#sql");

    var sqlEditor = null;
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

    var ui = (function() {
        var intervalControl = null;
        var data = {
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

    (function applyColorStyle() {
        var colorStyleMapping = {
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

        var cssContent = "";
        for (var opt in colorStyleMapping) {
            if (!colorStyleMapping.hasOwnProperty(opt)) {
                continue;
            }
            var setting = colorStyleMapping[opt];
            cssContent += setting.selector + " { " + setting.property + " : #" + options[opt] + "; } \n";
        }
        var styleSheet = document.createElement("style");
        styleSheet.appendChild(document.createTextNode(cssContent)); 
        (document.head || document.documentElement).appendChild(styleSheet);
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
                var $response = handleHtmlResponse(htmlResponse);
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
        var sqlStr = (sqlEditor == null ? $sql.val() : sqlEditor.doc.getValue());
        if($.trim(sqlStr) == ""){
            alert("Please enter the SQL script!");
            return;
        }

        var data = {
            sqlStr: sqlStr,
            dataSource: $("#dataSouce").val(),
            role: type,
            pageNumber: 1
        };
        $frame.data("data", data);

        ui.resetData();
        ui.clearFrame();

        ajaxExcuteSql(data, function($response) {
            var $table = $response.filter("table");
            if (options.auto_load_next_page == true) {
                $frame.append($table);
            } else {
                $frame.append($response);
            }
            var titles = $table.data("titles");
            var sameTitle = fetchFirstSameTitle(titles);
            if (sameTitle != null) {
                alert("WARNING:\n\n" +
                        "There are some columns with the same name: [" + sameTitle + "].\n\n" +
                        "You should know that there are some bugs occurred when selecting same column names.");
            }
        });

        function fetchFirstSameTitle(titles) {
            for (var j = 1; j < titles.length; j++) {
                for (var i = 0; i < j; i++) {
                    if (titles[i] == titles[j]) {
                        return titles[i];
                    }
                }
            }
            return null;
        }
    }

    function loadMore() {
        var data = $frame.data("data");
        data.pageNumber++;

        ajaxExcuteSql(data, function($response) {
            var $table = $response.filter("table");
            $frame.find("table").append($table.find("tr"));
        });
    }

    function handleHtmlResponse(htmlResponse) {
        var $response = $(htmlResponse);

        var rowCount = parseInt($($response.filter("#rowCount").val()).text());
        var pageNumber = parseInt($response.filter("#pageNumber").val());
        ui.updateData(rowCount, pageNumber);

        var $table = $response.filter("table");
        var rowId = 0;
        var titles = [];
        $table.find("tr").each(function() {
            var $tr = $(this);
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
                    var t = 0;
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
        var formatSqlHandler = function(e) {
            var sqlStr = (sqlEditor == null ? $sql.val() : sqlEditor.doc.getValue());
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
        var $button = $("<input type='button' id='btnFormat' value=' Format SQL ' title='Ctrl + Shift + F' />").click(formatSqlHandler);
        $("input[type=button]").each(function() {
            var $this = $(this);
            if ($.trim($this.val()) == "query") {
                $this.before($button.attr("style", $this.attr("style"))).before(" ");
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
}
