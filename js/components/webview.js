(function ($) {
    const remote = require('@electron/remote');
    const { globalShortcut } = remote;
    const localShortcut = require('electron-localshortcut');
    const win = remote.getCurrentWindow();

    $.fn.webview = function (params) {
        var request = require('request');
        var openfpt_api_key = "01b4a2586f2f4ea0a73a6c650f8bd49f"

        // Fetch start args from remote globals
        var startArgs = remote.getGlobal("startArgs");
        var fileToStart = (startArgs && startArgs.data) ? startArgs.data[2] : null;

        var settings = $.extend({
            url: "",
            tab: null
        }, params),
            t = this,
            lastUrl = ''

        var pref = 'contextIsolation=no, nodeIntegration=yes';
        var settingmng = require('electron-settings')

        if (!settingmng.getSync("settings.allowScript")) {
            pref += ', javascript=0'
        }
        if (!settingmng.getSync("settings.allowImage")) {
            pref += ', images=0'
        }

        t.isPrivacy = false
        t.webview = $('<webview class="webview" preload="js/extensions/preload.js" webpreferences="' + pref + '" useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 KT-Browser/8.0.0-alpha" autosize="on" src="about:blank" plugins>').appendTo($(this))[0]
        t.storage = new Storage()
        t.string = "Siema"

        // Initialize context menu
        t.contextMenu = new ContextMenu(t.webview)
        // TODO: Add destroy method
        // Helper to safely update bar display
        function setBarDisplay(displayValue) {
            if (settings.tab && settings.tab.instance && settings.tab.instance.bar) {
                if (typeof settings.tab.instance.bar.css === 'function') {
                    settings.tab.instance.bar.css('display', displayValue);
                } else if (settings.tab.instance.bar.style) {
                    settings.tab.instance.bar.style.display = displayValue;
                } else {
                    $(settings.tab.instance.bar).css('display', displayValue);
                }
            }
        }

        t.fitToParent = function () {
            $(t.webview).css({
                width: window.innerWidth,
                height: window.innerHeight - 79,
                marginTop: '48px'
            })

            setBarDisplay('block');

            // Safe executeJavaScript
            try {
                t.webview.executeJavaScript('isfullscreen()', true)
                    .then(result => {
                        if (result == true) {
                            $(t.webview).css({
                                width: window.innerWidth,
                                height: window.innerHeight,
                                marginTop: '-48px'
                            })
                            setBarDisplay('none');
                        } else {
                            $(t.webview).css({
                                width: window.innerWidth,
                                height: window.innerHeight - 79,
                                marginTop: '48px'
                            })
                            setBarDisplay('block');
                        }
                    }).catch(() => {
                        // Webview might not be ready, ignore
                    })
            } catch (e) {
            }
        }

        t.fitToParent()

        localShortcut.register(win, 'F12', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.openDevTools()
        });
        localShortcut.register(win, 'CmdOrCtrl+Shift+I', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.openDevTools()
        });
        localShortcut.register(win, 'F5', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.reload()
        });
        localShortcut.register(win, 'CmdOrCtrl+R', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.reload()
        });
        localShortcut.register(win, 'CmdOrCtrl+Shift+R', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.reloadIgnoringCache()
        });
        localShortcut.register(win, 'Shift+F5', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.reloadIgnoringCache()
        });
        localShortcut.register(win, 'Alt+Home', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.loadURL(settings.get("settings.homePage", "kt-browser://newtab"))
        });

        localShortcut.register(win, 'CmdOrCtrl+P', () => {
            if (remote.getCurrentWindow().isFocused())
                t.webview.print({
                    silent: false,
                    printBackground: false
                })
        });

        $(window).resize(function () {
            t.fitToParent()
        })

        t.updateURLBarIcon = function () {
            if (!settings.tab.instance.bar || typeof settings.tab.instance.bar.find !== 'function') return;

            settings.tab.instance.bar.rdBtn.show()
            settings.tab.instance.bar.searchInput.css("width", "calc(100% - 120px)")
            var currentUrl = t.webview.getURL();

            if (currentUrl.startsWith("http://")) {
                settings.tab.instance.bar.searchIcon.html('http')
            }
            if (currentUrl.startsWith("https://")) {
                settings.tab.instance.bar.searchIcon.html('https')
            }
            if (currentUrl.startsWith("kt-browser://")) {
                settings.tab.instance.bar.searchIcon.html('public')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if (currentUrl.startsWith("kt-browser://newtab")) {
                settings.tab.instance.bar.searchIcon.html('search')
            }
            if (currentUrl.startsWith("file://")) {
                settings.tab.instance.bar.searchIcon.html('storage')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if (currentUrl.includes(`reader/index.html?url=`)) {
                settings.tab.instance.bar.searchIcon.html('remove_red_eye')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if (currentUrl.startsWith("data:text")) {
                settings.tab.instance.bar.searchIcon.html('description')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if (currentUrl.startsWith("data:image")) {
                settings.tab.instance.bar.searchIcon.html('image')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if (t.isPrivacy) {
                settings.tab.instance.bar.searchIcon.html('vpn_lock')
            }
        }

        this.webview.addEventListener('ipc-message', function (e) {
            if (e.channel == 'clicked') {
                if (settings.tab.instance.bar) settings.tab.instance.bar.suggestions.css('display', 'none')
                if (settings.tab.instance.menu) settings.tab.instance.menu.hide()
            }
            if (e.channel == 'status') {
                if (typeof e.args[0] == 'undefined' || !e.args[0] || e.args[0].length === 0 || e.args[0] === "" || !/[^\s]/.test(e.args[0]) || /^\s*$/.test(e.args[0]) || e.args[0].replace(/\s/g, "") === "") {
                    settings.tab.instance.status.css("display", "none")
                } else {
                    if (e.args[0].length > 71) {
                        settings.tab.instance.status.html(e.args[0].substring(0, 70) + "...")
                    } else {
                        settings.tab.instance.status.html(e.args[0]);
                    }
                    settings.tab.instance.status.css("display", "inline")
                }
            }
        })

        //webview ready event
        $(t.webview).ready(function () {
            if (fileToStart != null) {
                url = fileToStart;
                fileToStart = null;
            }

            if (settings.url != null || settings.url != "")
                t.webview.loadURL(settings.url)
        });

        // DOM-READY event
        t.webview.addEventListener('dom-ready', () => {
            t.fitToParent();

            // Access getWebContents only here
            var ses = remote.webContents.fromId(t.webview.getWebContentsId()).session

            if (settings.tab.instance.bar && settings.tab.instance.bar.searchInput) {
                settings.tab.instance.bar.searchInput.focus()
            }
            settings.tab.Favicon.css('opacity', "0")
            settings.tab.Preloader.css('opacity', "0")

            ses.allowNTLMCredentialsForDomains('*')
            ses.on('will-download', (event, item, webContents) => { })
        });

        //webview newwindow event
        t.webview.addEventListener('new-window', (e) => {
            const protocol = require('url').parse(e.url).protocol
            if (protocol === 'http:' || protocol === 'https:') {
                var tab = new Tab(),
                    instance = $('#instances').browser({
                        tab: tab,
                        url: e.url
                    })
                addTab(instance, tab);
            }
        });

        t.webview.addEventListener('did-frame-finish-load', function (e) {
            const isMainFrame = e.isMainFrame;

            settings.tab.Favicon.css('opacity', "1");
            settings.tab.Preloader.css('opacity', "0");

            if (lastUrl != t.webview.getURL()) {
                if (!t.isPrivacy) {
                    t.storage.saveHistory(t.webview.getTitle(), t.webview.getURL())
                }
                lastUrl = t.webview.getURL()
            }
            if (!t.webview.getURL().startsWith("kt-browser://newtab") && t.webview.getURL() != "about:blank" && !t.webview.getURL().includes(`reader/index.html?url=`)) {
                if (settings.tab.instance.bar) settings.tab.instance.bar.searchInput.val(t.webview.getURL());
            }

            if (settings.tab.instance.bar) {
                if (t.webview.canGoBack()) {
                    settings.tab.instance.bar.backBtn.enabled = true
                } else {
                    settings.tab.instance.bar.backBtn.enabled = false
                }
                if (t.webview.canGoForward()) {
                    settings.tab.instance.bar.forwardBtn.enabled = true
                } else {
                    settings.tab.instance.bar.forwardBtn.enabled = false
                }
            }

            t.updateURLBarIcon()

            if (isMainFrame) {
                t.webview.executeJavaScript('stylishMenu()', false);
                t.webview.executeJavaScript('isNightMode()', true).then(result => {
                    if (result == true) {
                        t.webview.executeJavaScript('NightMode()', false);
                    }
                }).catch(() => { });

                // Ad removal scripts
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("banner300250-L"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("div-banner300250"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("banner-LR"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("aCenter padB2 banner-position"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("ad-div mastad"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
            }

            t.webview.executeJavaScript('try { function a() {return $(document.body).css("background-color")} a() } catch(err) {}', true).then(result => {
                if (result !== null) {
                    if ((result.replace(/^.*,(.+)\)/, '$1') == 0)) {
                        t.webview.executeJavaScript('try {$(document.body).css("background-color", "#fff")} catch(err) {}', true)
                    }
                }
            }).catch(() => { });

            t.webview.executeJavaScript('isMacRender()', true).then(result => {
                if (result == true) {
                    t.webview.executeJavaScript('MacRender()', false);
                }
            }).catch(() => { });
            /*
            if(isMainFrame && getSettings("settings.colorByPage", true)) {
                var colors = new Colors(t.webview);
                colors.getColor(function (data) {
                    if (settings.tab.Color != data.background) {
                        settings.tab.Color = data.background;
                        if (settings.tab.selected) {
                        // This part is complex because it modifies the main window.
                        // You might need to use IPC to send the color to the main renderer process.
                        // For now, let's assume the logic inside browser.js can be triggered from here.
                        remote.getCurrentWindow().webContents.executeJavaScript(`
                            var tab = tabCollection.find(t => t.selected);
                            if (tab) {
                                tab.Color = "${data.background}";
                                setColor("${data.background}");
                                updateColor();
                            }
                        `);
                        }
                    }
                });
            }*/
        });

        t.webview.addEventListener('did-fail-load', function (e) {
            let errorCode = e.errorCode
            let errorDescription = e.errorDescription

            let dir = __dirname
            if (!errorCode == 0)
                settings.tab.instance.status.html(errorDescription + ": " + errorCode);
            settings.tab.instance.status.css("display", "inline")
        })

        t.webview.addEventListener('leave-html-full-screen', function () {
            t.fitToParent()
        });
        t.webview.addEventListener('enter-html-full-screen', function () {
            t.fitToParent()
        });

        t.webview.addEventListener('plugin-crashed', function (e) {
            remote.getCurrentWindow().webContents.executeJavaScript("$('.maindiv').msgBox({title:'" + "Plugin Error" + "',message:'" + "Plugin " + e.name + " is not responding." + "',buttons:[{text:'OK',callback:function(){$('p').fadeIn()}}],blend:!0});")
        });
        t.webview.addEventListener('did-start-loading', function () {
            if (settings.tab.instance.bar) settings.tab.instance.bar.suggestions.css('display', 'none');
            settings.tab.Favicon.css('opacity', "0");
            settings.tab.Preloader.css('opacity', "1");
            t.webview.executeJavaScript('stylishMenu()', false).catch(() => { });
        });
        t.webview.addEventListener('page-title-updated', function (e) {
            settings.tab.Title.html("<p style='display: inline; width:50%;'>" + "&nbsp;&nbsp;" + e.title + "</p>");
            if (lastUrl != t.webview.getURL()) {
                t.storage.saveHistory(t.webview.getTitle(), t.webview.getURL())
                lastUrl = t.webview.getURL()
            }
            if (!t.webview.getURL().startsWith("kt-browser://newtab") && t.webview.getURL() != "about:blank" && !t.webview.getURL().includes(`reader/index.html?url=`)) {
                if (settings.tab.instance.bar) settings.tab.instance.bar.searchInput.val(t.webview.getURL());
            }
        });
        t.webview.addEventListener('load-commit', function (e) {
            if (e.url.length > 65 && !e.url.startsWith("about:")) {
                settings.tab.instance.status.html("Loading: " + e.url.substring(0, 64) + "...")
            } else {
                settings.tab.instance.status.html("Loading: " + e.url + "...")
            }
            settings.tab.instance.status.css("display", "inline")
            if (settings.tab.instance.bar) settings.tab.instance.bar.suggestions.css('display', 'none');
            if (settingmng.getSync("settings.blockUnsafeWeb")) {
                if (!e.url.startsWith("kt-browser://") && !e.url.startsWith("about:") && !e.url.startsWith("chrome://") && !e.url.startsWith("file://") && e.isMainFrame) {
                    request('http://api.openfpt.vn/cyradar?api_key=' + openfpt_api_key + '&url=' + e.url, function (error, response, body) {
                        try {
                            if (JSON.parse(body).conclusion != "safe") {
                                t.webview.loadURL("")
                            }
                        } catch (err) { }
                    });
                }
            }
        });

        t.webview.addEventListener('page-favicon-updated', function (e) {
            if (e.favicons && e.favicons.length > 0) {
                var iconUrl = e.favicons[0];
                
                // 1. Update the UI Icon
                settings.tab.Favicon.html("<div class='favicon' style='background-image: url(\"" + iconUrl + "\");'></div>");
                settings.tab.Favicon.css('opacity', "1");
                settings.tab.Preloader.css('opacity', "0");

                // 2. Calculate Color from Favicon
                if (require('electron-settings').getSync("settings.colorByPage")) {
                    getDominantColor(iconUrl, function(hexColor) {
                        // Store this color in the tab object for later use
                        settings.tab.FaviconColor = hexColor;
                        
                        // Trigger the main color update logic (which will decide Meta vs Favicon)
                        // We'll define 'updateTabColor' in browser.js next
                        if (typeof t.updateTabColorReference === 'function') {
                            t.updateTabColorReference();
                        }
                    });
                }
            }
        });

        return this
    }
}(jQuery))