function installExtension(extensionId, options) {
    var itemsPerPage = 50;
    var $frame = $("#frame");

    var extensionBaseUrl = "chrome-extension://" + extensionId + "/";
    var sqlEditor = CodeMirror.fromTextArea('sql', {
        path: extensionBaseUrl + "libs/codemirror/",
        parserfile: "parsesql.js",
        stylesheet: extensionBaseUrl + "libs/codemirror/sqlcolors.css"
    });

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

    function ajaxExcuteSql(data, callback) {
        ui.startLoading();
        currentAjax = $.ajax({
            type: "POST",
            url: "executeSql.action",
            timeout: 3600000, // one hour
            data: data,
            dataType: "html",
            success: function(response) {
                var $response = $(response);

                var rowCount = parseInt($($response.filter("#rowCount").val()).text());
                var pageNumber = parseInt($response.filter("#pageNumber").val());
                ui.updateData(rowCount, pageNumber);

                var $table = $response.filter("table");
                var rowId = 0;
                var titles = [];
                $table.find("tr").each(function() {
                    var $tr = $(this);
                    if (rowId == 0) {
                        $tr.find("th").each(function() {
                            titles.push($(this).text());
                        });
                        $tr.addClass("title-row").prepend("<th>#" + pageNumber + "</th>");
                    } else {
                        var t = 0;
                        $tr.find("td").each(function() {
                            $(this).prop("title", titles[t++]);
                        });
                        $tr.addClass("data-row").prepend("<td>" + ((pageNumber - 1) * itemsPerPage + rowId) + "</td>");
                    }
                    rowId++;
                });

                callback($table);
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
        //var sqlStr = $("#sql").val();
        var sqlStr = sqlEditor.getCode();
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

        ajaxExcuteSql(data, function($table) {
            $frame.append($table);
        });
    }

    function loadMore() {
        var data = $frame.data("data");
        data.pageNumber++;

        ajaxExcuteSql(data, function($table) {
            $frame.find("table").append($table.find("tr"));
        });
    }

    // F5: execute SQL command
    var f5Handler = function(e) {
        if ((e.which || e.keyCode) == 116) {
            e.preventDefault();
            search('readOnly');
        }
    };
    $(document).bind("keydown", f5Handler);
    $(sqlEditor.frame.contentWindow.document).bind("keydown", f5Handler);

    // Load more data (next page) when scroll near bottom of page
    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() < $(document).height() - 500) {
            return;
        }
        if (!ui.canLoadMore()) {
            return;
        }
        loadMore();
    });

    // Result info
    $("#excuteTime").after("<div id='resultInfo' style='display: inline-block; padding-left: 10px;'></div>");

    // Toggle background color when clicking row 
    $(document).on("click", "table.tableStyle2 tr.data-row td", function() {
        $(this).parent("tr").toggleClass("checked");
    });
}
