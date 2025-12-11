(function ($) {
    function isValidURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    }

    $.fn.searchInput = function (params) {
        var settings = $.extend({
            tab: null
        }, params)
            , t = this
            , webview = settings.tab.instance.webview.webview

        $(this).focusin(function () {
            $(this).select();
        });

        $(this).keypress(function (e) {
            var val = $(t).val().trim();
            var suggestions = settings.tab.instance.bar.suggestions;

            if (e.which == 13) { // Enter key
                suggestions.css('display', 'none');

                // Internal Pages
                if (val.startsWith("kt-browser://") || val.startsWith("file://")) {
                    webview.loadURL(val);
                    return false;
                }

                // Check if it looks like a URL or an IP
                if (isValidURL(val) || val.includes('localhost')) {
                    if (val.startsWith("http://") || val.startsWith("https://")) {
                        webview.loadURL(val);
                    } else {
                        webview.loadURL("http://" + val);
                    }
                } else {
                    // Search
                    var engine = getSearchEngine(); // Global function from preload/main
                    var searchUrl = "";
                    switch (engine) {
                        case "2": searchUrl = "http://coccoc.com/search#query="; break;
                        case "3": searchUrl = "https://duckduckgo.com/?q="; break;
                        case "4": searchUrl = "https://www.bing.com/search?q="; break;
                        case "5": searchUrl = "https://search.yahoo.com/search?p="; break;
                        case "6": searchUrl = "https://www.yandex.com/search/?text="; break;
                        default: searchUrl = "http://www.google.com/search?q="; break;
                    }
                    webview.loadURL(searchUrl + encodeURIComponent(val));
                }
                return false;
            }
        });
        return this;
    }
}(jQuery));