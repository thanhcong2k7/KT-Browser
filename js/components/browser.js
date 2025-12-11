(function ($) {
    const settings = require('electron-settings');
    const remote = require('@electron/remote');
    const { globalShortcut, app } = remote;
    const fs = require('fs');
    var bookmarkPath = app.getPath('userData') + '/User Data/Bookmarks';
    $.fn.browser = function (params) {
        var settings = $.extend({
            url: "",
            tab: null
        }, params),
            browser = $('<div class="tabWindow">').appendTo($(this)),
            status = $('<div class="status" unselectable="on" style="cursor: default; -webkit-user-select: none; user-select: none; -o-user-select: none;">').appendTo(browser),
            bar = $('<div class="bar">').appendTo(browser),
            bookmarksBar = $('<div class="bookmarks-bar">').appendTo(browser),
            content = $('<div class="content">').appendTo(browser),
            t = this,
            menu = $('<div class="menu" style="z-index: 9999;">').appendTo(content)
        t.menu = menu.menu({
            tab: settings.tab
        })
        this.updateBookmarks = t.updateBookmarks;
        checkFiles()
        settings.tab.tabWindow = browser

        $(settings.tab).on('ready', function (e, tab) {
            settings.tab = tab
            t.webview = content.webview({
                tab: settings.tab,
                url: settings.url
            })
            t.status = status
            t.bar = bar.bar({
                tab: settings.tab
            })
            t.updateBookmarks = function () {
                bookmarksBar.empty();
                // Read file directly here instead of calling a missing global function
                var data = { bookmark: [] };
                if (fs.existsSync(bookmarkPath)) {
                    try {
                        data = JSON.parse(fs.readFileSync(bookmarkPath));
                    } catch (e) {
                        data = { bookmark: [] };
                    }
                }
                if (data && data.bookmark) {
                    data.bookmark.forEach(function (item) {
                        var bmItem = $('<div class="bookmark-item ripple">').appendTo(bookmarksBar);
                        // Favicon
                        var iconUrl = "http://www.google.com/s2/favicons?domain=" + item.link;
                        $('<img src="' + iconUrl + '" class="bm-icon">').appendTo(bmItem);
                        $('<span class="bm-title">').text(item.title).appendTo(bmItem);
                        // Load URL on click
                        bmItem.click(function () {
                            t.webview.loadURL(item.link);
                        });
                        // Ripple effect
                        bmItem.mousedown(function (e) {
                            var relX = e.pageX - $(this).offset().left;
                            var relY = e.pageY - $(this).offset().top;
                            Ripple.makeRipple($(this), relX, relY, $(this).width(), $(this).height(), 300, 0);
                        });
                    });
                }
            };
            const updateTabColor = () => {
                if (settings.tab.selected) {
                    // PASS settings.tab.FaviconColor as the fallback!
                    t.colors.getColor(settings.tab.FaviconColor, function (data) {

                        if (settings.tab.Color != data.background) {
                            settings.tab.Color = data.background;
                            settings.tab.Tab.css('background-color', data.background);

                            t.webview.webview.executeJavaScript('setTitleBarColor("' + shadeColor2(data.background, -0.2) + '")')
                                .catch(() => { });

                            t.bar.css('background-color', data.background);
                            changeForeground(data.foreground, data.foreground == 'white' ? '#fff' : '#444');
                        }
                    });
                }
            };
            t.webview.updateTabColorReference = updateTabColor;
            t.webview.webview.addEventListener('did-stop-loading', updateTabColor);
            t.webview.webview.addEventListener('did-navigate-in-page', updateTabColor);
            setInterval(updateTabColor, 3000);
            // RE-CALL LAYOUT: Now that t.bar is initialized, let webview fix layout
            // The fitToParent function is attached to the returned jQuery object in webview.js
            // Since t.webview is that object, we can call it.
            if (t.webview.fitToParent) {
                t.webview.fitToParent();
            }

            if (getSettings("settings.colorByPage", true)) {
                t.colors = new Colors(t.webview.webview)
                /*
                setInterval(function () {
                    if (settings.tab.selected) {
                        t.colors.getColor(function (data) {
                            if (settings.tab.Color != data.background) {
                                settings.tab.Color = data.background
                                settings.tab.Tab.css('background-color', data.background)
                                t.webview.webview.executeJavaScript('setTitleBarColor("' + shadeColor2(data.background, -0.2) + '")', false);
                                t.bar.css('background-color', data.background)
                                changeForeground(data.foreground, data.foreground == 'white' ? '#fff' : '#444')
                            }
                        })
                    }
                }, 200)*/
            }

            function changeForeground(color, ripple) {
                if (settings.tab.selected) {
                    if (color == 'white') {
                        settings.tab.Title.css('color', '#fff')
                        settings.tab.Preloader.attr('color', '#fff')
                    } else if (color == 'black') {
                        settings.tab.Title.css('color', '#444')
                        settings.tab.Preloader.attr('color', '#3F51B5')
                    }
                    settings.tab.closeBtn.css('color', color)
                }

                settings.tab.Foreground = color
                if (color == 'white') {
                    t.bar.searchBox.css({
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#fff'
                    })
                    t.bar.searchInput.css('color', '#fff')
                } else if (color == 'black') {
                    t.bar.searchBox.css({
                        backgroundColor: 'white',
                        color: '#212121'
                    })
                    t.bar.searchInput.css('color', '#212121')
                }
                t.bar.refreshBtn.attr('data-ripple-color', ripple).css('color', color)
                t.bar.backBtn.attr('data-ripple-color', ripple).css('color', color)
                t.bar.forwardBtn.attr('data-ripple-color', ripple).css('color', color)
                t.bar.extBtn.attr('data-ripple-color', ripple).css('color', color)
            }
            t.updateBookmarks();
        })


        globalShortcut.register('F10', () => {
            t.menu.show();
        });
        globalShortcut.register('Alt+F', () => {
            t.menu.show();
        });
        globalShortcut.register('Alt+E', () => {
            t.menu.show();
        });
        return this
    }
}(jQuery))