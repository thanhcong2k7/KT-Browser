(function ($) {
    const settings = require('electron-settings');
    const remote = require('@electron/remote');
    const { globalShortcut } = remote;
    $.fn.browser = function (params) {
        var settings = $.extend({
                url: "",
                tab: null
            }, params),
            browser = $('<div class="tabWindow">').appendTo($(this)),
            status = $('<div class="status" unselectable="on" style="cursor: default; -webkit-user-select: none; user-select: none; -o-user-select: none;">').appendTo(browser),
            bar = $('<div class="bar">').appendTo(browser),
            content = $('<div class="content">').appendTo(browser),
            t = this,
            menu = $('<div class="menu" style="z-index: 9999;">').appendTo(content)
        t.menu = menu.menu({
            tab: settings.tab
        })

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