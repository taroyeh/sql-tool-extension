$("#tabs").tabs().css({
   'min-height': '316px',
   'overflow': 'auto'
});

$("button").button();

$("#btnReset").click(function(e) {
    $("#fmOptions")[0].reset();
    e.preventDefault();
});

$("#btnSave").click(function(e) {
    // TODO: save options
    e.preventDefault();
    window.close();
});