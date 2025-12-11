(function ($) {
    const remote = require('@electron/remote');
    const { ipcRenderer } = require('electron');
    const settings = require('electron-settings');

    $.fn.menu = function (params) {
        var settings = $.extend({
            tab: null
        }, params),
            t = this

        t.toggled = false
        $(t).css({
            opacity: 0,
            display: 'none'
        })

        t.menuItems = $('<ul class="menu-items" style="z-index: 9999;background-color: #fff;">').appendTo($(t))
        t.newWindow = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.private = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        $('<li class="menu-spec">').appendTo(t.menuItems)

        // [FIX] Initialize Fullscreen button for all platforms (previously only win32)
        t.fullscreen = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.fullscreen.append('<i class="material-icons">fullscreen</i>')
        t.fullscreen.append('<p class="menu-text">Fullscreen</p>')
        $('<li class="menu-spec">').appendTo(t.menuItems)

        t.history = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.bookmarks = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.downloads = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        $('<li class="menu-spec">').appendTo(t.menuItems)
        t.nightmode = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.vpn = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        $('<li class="menu-spec">').appendTo(t.menuItems)

        t.settings = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.devTools = $('<li class="menu-item ripple">').appendTo(t.menuItems)
        t.info = $('<li class="menu-item ripple">').appendTo(t.menuItems)

        // Append content
        t.settings.append('<i class="material-icons">settings</i><p class="menu-text">Settings</p>')
        t.history.append('<i class="material-icons">history</i><p class="menu-text">History</p>')
        t.bookmarks.append('<i class="material-icons">collections_bookmark</i><p class="menu-text">Bookmarks</p>')
        t.downloads.append('<i class="material-icons">file_download</i><p class="menu-text">Downloads</p>')
        t.newWindow.append('<i class="material-icons">desktop_windows</i><p class="menu-text">New window</p>')
        t.devTools.append('<i class="material-icons">code</i><p class="menu-text">Developer Tools</p>')
        t.info.append('<i class="material-icons">info</i><p class="menu-text">About KT Browser</p>')

        $(t).find('.menu-item').mousedown(function (e) {
            makeRippleMenuItem(this, e);
        })

        $(window).on('click', function () {
            t.hide()
        })

        t.history.click(function (e) {
            var tab = new Tab(),
                instance = $('#instances').browser({
                    tab: tab,
                    url: 'kt-browser://history'
                })
            addTab(instance, tab);
        });

        t.newWindow.click(function (e) {
            ipcRenderer.send('open-window', 'new-window');
        });

        t.private.click(function (e) {
            if (settings.tab.instance.webview.isPrivacy) {
                Toast_Material({ content: "Incognito mode is now off", updown: "bottom", position: "center", align: "center" });
                settings.tab.instance.webview.isPrivacy = false;
            } else {
                Toast_Material({ content: "Incognito mode is now on", updown: "bottom", position: "center", align: "center" });
                settings.tab.instance.webview.isPrivacy = true;
            }
            settings.tab.instance.webview.updateURLBarIcon()
        });

        // [FIX] Check existence of t.fullscreen to prevent crash on click logic execution
        if (t.fullscreen) {
            t.fullscreen.click(function (e) {
                const win = remote.getCurrentWindow();
                win.setFullScreen(!win.isFullScreen());
            });
        }

        t.nightmode.click(function (e) {
            const webview = settings.tab.instance.webview.webview;

            // Check status via ContextBridge (using executeJavaScript because webview tag is isolated)
            webview.executeJavaScript('window.ktBrowserAPI.isNightMode()')
                .then(isNight => {
                    if (isNight) {
                        webview.executeJavaScript('window.ktBrowserAPI.setNightMode(false)');
                        webview.reload();
                    } else {
                        webview.executeJavaScript('window.ktBrowserAPI.setNightMode(true)');
                        webview.executeJavaScript(`
                        var css = "html { filter: invert(100%) hue-rotate(180deg); } img, video { filter: invert(100%) hue-rotate(180deg); }";
                        var style = document.createElement("style");
                        style.id = "night-mode-style";
                        style.innerText = css;
                        document.head.appendChild(style);
                    `);
                    }
                }).catch(err => console.log("Night mode toggle error:", err));
        });

        t.info.click(function (e) {
            ipcRenderer.send('open-window', 'about');
        });

        t.bookmarks.click(function (e) {
            ipcRenderer.send('open-window', 'bookmarks');
            if (bar.is(':visible')) {
                bar.hide();
            } else {
                bar.css('display', 'flex'); // Ensure it uses flex layout
                settings.tab.instance.updateBookmarks(); // Refresh data
            }

            // 3. Resize the webview to fit the new layout
            if (settings.tab.instance.webview.fitToParent) {
                settings.tab.instance.webview.fitToParent();
            }

            t.hide();
        });

        t.downloads.click(function (e) {
            ipcRenderer.send('open-window', 'downloads');
        });

        t.settings.click(function (e) {
            ipcRenderer.send('open-window', 'settings');
        });

        t.devTools.click(function (e) {
            settings.tab.instance.webview.webview.openDevTools({ mode: 'right' });
        });
        t.vpn.click(function (e) {
            if (typeof window.getVPN !== 'function' || typeof window.setVPN !== 'function') {
                return;
            }
            var newState = !window.getVPN();
            window.setVPN(newState);

            ipcRenderer.send('update-proxy-settings');

            if (newState) {
                var loc = window.getVPNLocation ? window.getVPNLocation() : "Unknown";
                Toast_Material({ content: "VPN Enabled (" + loc + ")", updown: "bottom", position: "center", align: "center" });
            } else {
                Toast_Material({ content: "VPN Disabled", updown: "bottom", position: "center", align: "center" });
            }
        });

        t.show = function () {
            t.private.html('<i class="material-icons">vpn_lock</i>');
            t.private.append(settings.tab.instance.webview.isPrivacy ?
                '<p class="menu-text">Exit private mode</p>' :
                '<p class="menu-text">Private mode</p>');

            t.vpn.html('<i class="material-icons">vpn_key</i>');
            t.vpn.append(window.getVPN() ?
                '<p class="menu-text">Turn off VPN</p>' :
                '<p class="menu-text">VPN</p>');

            if (window.getNightMode()) {
                t.nightmode.html('<i class="material-icons">wb_sunny</i><p class="menu-text">Exit night mode</p>');
                $(".menu-item").css("background-color", "#212121");
                $('.menu-item').hover(function () { $(this).css("background-color", "#424242"); }, function () { $(this).css("background-color", "#212121"); });
                $(".menu-text, .menu-item>i").css("color", "#fff");
                $(".ripple").attr("data-ripple-color", "#616161");
            } else {
                t.nightmode.html('<i class="material-icons">brightness_4</i><p class="menu-text">Night mode</p>');
                $(".menu-item").css("background-color", "#fff");
                $('.menu-item').hover(function () { $(this).css("background-color", "#E0E0E0"); }, function () { $(this).css("background-color", "#fff"); });
                $(".menu-text, .menu-item>i").css("color", "");
                $(".ripple").attr("data-ripple-color", "#444");
            }

            $(t).css('display', 'block');
            $(t).css('opacity', 0).animate({ opacity: 1 }, 200, function () { t.toggled = true }).css('top', -20).animate({ top: 8 }, { queue: false, duration: 100 });
        }

        t.hide = function () {
            $(t).css('opacity', 1).animate({ opacity: 0 }, 60).css('top', 8).animate({ top: -20 }, {
                queue: false,
                complete: function () { $(t).css('display', 'none'); },
                duration: 100
            });
            t.toggled = false;
        }

        return this
    }

}(jQuery))