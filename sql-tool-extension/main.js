(function() {
    var $frame = $("#frame");

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
                if (pageNumber * 50 >= rowCount) {
                    data.done = true;
                }
                $("#resultInfo").html(
                    "<span><b>Count: </b> " + rowCount + " </span> " + 
                    "<span><b>Page loaded: </b> " + pageNumber + " / " + Math.ceil(rowCount / 50) + " </span>"
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
                ui.updateData(
                    parseInt($($response.filter("#rowCount").val()).text()), // rowCount
                    parseInt($response.filter("#pageNumber").val())          // pageNumber
                );
                callback($response.filter("table"));
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
        var sqlStr = $("#sql").val();
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
    $(document).bind("keydown", function(e) {
        if ((e.which || e.keyCode) == 116) {
            e.preventDefault();
            search('readOnly');
        }
    });

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

    // Change style
    $("#sql").css({
        fontSize: '16pt',
        fontFamily: 'Courier New',
        fontWeight: 'bold'
    })

    // Result info
    $("#excuteTime").after("<div id='resultInfo' style='display: inline-block; padding-left: 10px;'></div>");
})();
