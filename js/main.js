(function () {
    const electron = require('electron')
    const remote = require('@electron/remote')
    const localShortcut = require('electron-localshortcut');
    const win = remote.getCurrentWindow();
    localShortcut.unregisterAll(win);
    // CRITICAL FIX: Polyfill electron.remote globally for legacy libs
    if (!electron.remote) {
        electron.remote = remote;
    }

    const {
        ipcRenderer
    } = electron;

    const {
        Menu,
        MenuItem,
        globalShortcut,
        app
    } = remote;

    var fs = require('fs');
    const settings = require('electron-settings');
    // REPLACEMENT: electron-is-dev is ESM only, use native check
    const isDev = !app.isPackaged;

    var IsThere = require("is-there");

    // SAFELY ACCESS STARTARGS
    var startArgs = remote.getGlobal("startArgs");
    var fileToStart = (startArgs && startArgs.data) ? startArgs.data[2] : null;

    var historyPath = app.getPath('userData') + '/User Data/History';
    var userdataPath = app.getPath('userData') + '/User Data';

    $(document).ready(function () {
        if ($('#tabbar').length > 0) {
            setInterval(function () {
                if (colorBrightness($(document.body).css('background-color')) < 150) {
                    for (var i = 0; i < tabCollection.length; i++) {
                        tabCollection[i].Title.css('color', '#fff')
                        tabCollection[i].Preloader.attr('color', '#fff')
                        tabCollection[i].closeBtn.css('color', '#fff')
                    }
                } else {
                    for (var i = 0; i < tabCollection.length; i++) {
                        tabCollection[i].Title.css('color', '#444')
                        tabCollection[i].Preloader.attr('color', '#3F51B5')
                        tabCollection[i].closeBtn.css('color', '#000')
                    }
                }
            }, 200);
            window.updateProxySettings();

            var tab = new Tab(),
                instance = $('#instances').browser({
                    tab: tab,
                    url: settings.getSync("settings.homePage") || "kt-browser://newtab"
                })
            addTab(instance, tab);

            localShortcut.register(win, 'CmdOrCtrl+T', () => {
                if (remote.getCurrentWindow().isFocused())
                    var tab = new Tab(),
                        instance = $('#instances').browser({
                            tab: tab,
                            url: settings.getSync("settings.homePage") || "kt-browser://newtab"
                        })
                addTab(instance, tab);
            });
            localShortcut.register(win, 'F11', () => {
                if (remote.getCurrentWindow().isFullScreen()) {
                    remote.getCurrentWindow().setFullScreen(false);
                } else {
                    remote.getCurrentWindow().setFullScreen(true);
                }
            });

            localShortcut.register(win, 'Esc', () => {
                if (remote.getCurrentWindow().isFullScreen()) {
                    remote.getCurrentWindow().setFullScreen(false);
                }
            });

            localShortcut.register(win, 'CmdOrCtrl+W', () => {
                if (remote.getCurrentWindow().isFocused()) {
                    for (var i = 0; i < tabCollection.length; i++) {
                        if (tabCollection[i].selected) {
                            tabCollection[i].closeBtn.click();
                        }
                    }
                }
            });
            localShortcut.register(win, 'CmdOrCtrl+F4', () => {
                if (remote.getCurrentWindow().isFocused()) {
                    for (var i = 0; i < tabCollection.length; i++) {
                        if (tabCollection[i].selected) {
                            tabCollection[i].closeBtn.click();
                        }
                    }
                }
            });
            localShortcut.register(win, 'CmdOrCtrl+Shift+W', () => {
                if (remote.getCurrentWindow().isFocused()) {
                    for (var i = 0; i < tabCollection.length; i++) {
                        tabCollection[i].closeBtn.click();
                    }
                }
            });
            localShortcut.register(win, 'CmdOrCtrl+H', () => {
                if (remote.getCurrentWindow().isFocused())
                    var tab = new Tab(),
                        instance = $('#instances').browser({
                            tab: tab,
                            url: 'kt-browser://history/'
                        })
                addTab(instance, tab);
            });
            localShortcut.register(win, 'CmdOrCtrl+T', () => {
                if (remote.getCurrentWindow().isFocused())
                    var tab = new Tab(),
                        instance = $('#instances').browser({
                            tab: tab,
                            url: settings.getSync("settings.homePage", "kt-browser://newtab")
                        })
                addTab(instance, tab);
            });
            localShortcut.register(win, 'CmdOrCtrl+Shift+T', () => {
                if (remote.getCurrentWindow().isFocused())
                    Toast_Material({
                        content: "Not yet complete",
                        updown: "bottom",
                        position: "center",
                        align: "center"
                    });
            });

            document.addEventListener("contextmenu", function (e, params) {
                e.preventDefault();
                e.stopPropagation();
                //TODO: can...
                let node = e.target;
                while (node) {
                    if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
                        const menu = new Menu()
                        menu.append(new MenuItem({
                            label: 'Undo',
                            accelerator: 'CmdOrCtrl+Z',
                            role: 'undo'
                        }))
                        menu.append(new MenuItem({
                            label: 'Redo',
                            accelerator: 'CmdOrCtrl+Shift+Z',
                            role: 'redo'
                        }))
                        menu.append(new MenuItem({
                            type: 'separator'
                        }))
                        menu.append(new MenuItem({
                            label: 'Cut',
                            accelerator: 'CmdOrCtrl+X',
                            role: 'cut'
                        }))
                        menu.append(new MenuItem({
                            label: 'Copy',
                            accelerator: 'CmdOrCtrl+C',
                            role: 'copy'
                        }))
                        menu.append(new MenuItem({
                            label: 'Paste',
                            accelerator: 'CmdOrCtrl+V',
                            role: 'paste'
                        }))
                        menu.append(new MenuItem({
                            type: 'separator'
                        }))
                        menu.append(new MenuItem({
                            label: 'Select All',
                            accelerator: 'CmdOrCtrl+A',
                            role: 'selectall'
                        }))

                        menu.popup(remote.getCurrentWindow())
                        break;
                    }
                    node = node.parentNode;
                }
            });

            if (settings.getSync('settings.blockads')) {
                registerFiltering(remote.getCurrentWindow().webContents.session)
            }
            /*
            setInterval(function () {
                if (settings.getSync('static.VPN')) {
                    remote.getCurrentWindow().webContents.session.setProxy({
                        pacScript: settings.getSync("settings.nvProxy")
                    }).then(() => { });
                } else {
                    remote.getCurrentWindow().webContents.session.setProxy({
                        pacScript: ""
                    }).then(() => { });
                }
    
            }, 1000);
            */
            //Disable VPN for now, bug

            /*
            //Warning message for alpha version
            $('.maindiv').msgBox({
                title: 'Warning',
                message: 'This is the alpha version of KT Browser 7.0. Keep in mind that this release is not feature-complete yet and there are many bugs and errors to watch out.',
                buttons: [{
                    text: 'I understand',
                    callback: function () {
                        $('p').fadeIn()
                    }
                }],
                blend: !0
            });
            */
        }
    })
    window.onresize = function (event) {
        calcSizes(false, false);
    };

    $('.windowbutton-close').click(function () {
        remote.getCurrentWindow().close();
    });
    $('.windowbutton-maximize').click(function () {
        if (remote.getCurrentWindow().isMaximized()) {
            remote.getCurrentWindow().unmaximize();
        } else {
            remote.getCurrentWindow().maximize();
        }
    });
    $('.windowbutton-minimize').click(function () {
        remote.getCurrentWindow().minimize();
    });

    window.showApp = function (url) {
        const BrowserWindow = remote.BrowserWindow;

        var mainWindow = new BrowserWindow({
            title: 'Apps - KT Browser',
            frame: false,
            width: 600,
            height: 750,
            show: false,
            // ADD THIS BLOCK TO ALL POPUP WINDOWS:
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true // Required since you use remote inside settings.html
            }
        })


        if (isDev) {
            mainWindow.webContents.openDevTools()
        }

        mainWindow.loadURL(url)
    }

    window.showWebApp = function (url) {
        const BrowserWindow = remote.BrowserWindow;

        var mainWindow = new BrowserWindow({
            title: 'KT Browser Apps',
            frame: false,
            width: 600,
            height: 750,
            show: false,
            // ADD THIS BLOCK TO ALL POPUP WINDOWS:
            webPreferences: {
                "web-security": false,
                nodeIntegration: true,
                allowRunningInsecureContent: true,
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        })

        if (isDev) {
            mainWindow.webContents.openDevTools()
        }
        mainWindow.loadURL('kt-browser://window')
        mainWindow.webContents.executeJavaScript("loadPages('" + url + "')")
    }

    window.checkFiles = function () {
        if (!IsThere(userdataPath)) {
            fs.mkdirSync(userdataPath, { recursive: true });
        }
        if (!IsThere(historyPath)) {
            fs.writeFileSync(historyPath, '{"history":[]}');
        }
    }

    window.getNightMode = function () {
        return settings.getSync('static.NightMode');
    }

    window.getVPN = function () {
        return settings.getSync('static.VPN');
    }

    window.getVPNLocation = function () {
        switch (settings.getSync('settings.nvProxy')) {
            case "http://kt-browser.com/Singapore.pac":
                return 'Singapore'
                break
            case "http://kt-browser.com/Frankfurt.pac":
                return 'Frankfurt'
                break
            case "http://kt-browser.com/HongKong.pac":
                return 'Hong Kong'
                break
            case "http://kt-browser.com/LondonUK.pac":
                return 'London - UK'
                break
            case "http://kt-browser.com/LosAngelesUS.pac":
                return 'Los Angeles - US'
                break
            case "http://kt-browser.com/NewYorkUS.pac":
                return 'New York - US'
                break
            case "http://kt-browser.com/Romania.pac":
                return 'Romania'
                break
            case "http://kt-browser.com/SanFranciscoUS.pac":
                return 'San Francisco - US'
                break
            case "http://kt-browser.com/Sydney.pac":
                return 'Sydney'
                break
            case "http://kt-browser.com/WashingtonUS.pac":
                return 'Washington - US'
                break
        }
    }

    window.checkVPN = function () {
        return settings.getSync('static.VPN');
    }

    window.getSearchEngine = function () {
        return settings.getSync('settings.SearchEngine');
    }

    window.setNightMode = function (value) {
        settings.setSync('static.NightMode', value);
    }

    window.setVPN = function (value) {
        settings.setSync('static.VPN', value);
    }

    window.updateProxySettings = function () {
        var session = remote.getCurrentWindow().webContents.session;
        var useVPN = settings.getSync('static.VPN');
        var proxyScript = settings.getSync("settings.nvProxy");

        session.setProxy({
            pacScript: useVPN ? proxyScript : ""
        }).then(() => {
            console.log("Proxy settings updated. VPN: " + useVPN);
        }).catch(err => console.error("Failed to set proxy", err));
    };

    window.getSettings = function (setting, defaultvalue) {
        return settings.getSync(setting, defaultvalue);
    }

    window.updatetextColor = function () {
        if (colorBrightness($(document.body).css('background-color')) < 150) {
            for (var i = 0; i < tabCollection.length; i++) {
                tabCollection[i].Title.css('color', '#fff')
                tabCollection[i].Preloader.attr('color', '#fff')
                tabCollection[i].closeBtn.css('color', '#fff')
            }
        } else {
            for (var i = 0; i < tabCollection.length; i++) {
                tabCollection[i].Title.css('color', '#444')
                tabCollection[i].Preloader.attr('color', '#3F51B5')
                tabCollection[i].closeBtn.css('color', '#000')
            }
        }
    }

    window.updateColor = function () {
        for (var i = 0; i < tabCollection.length; i++) {
            if (tabCollection[i].selected) {
                if (tabCollection[i].Color != document.body.style.background) {
                    a = shadeColor2(tabCollection[i].Color, -0.2)
                    setColor(tabCollection[i].Color)
                    titlebar.style.background = a;
                }
            }
        }
        updatetextColor()
    }

    window.setColor = function (color) {
        $(document.body).css('background-color', color)
        if (colorBrightness(color) < 150) {
            $(document.body).find(".windowbutton-close").css('background-image', 'url(img/WindowButtons/close-white.png)')
            $(document.body).find(".windowbutton-minimize").css('background-image', 'url(img/WindowButtons/minimize-white.png)')
            $(document.body).find(".windowbutton-maximize").css('background-image', 'url(img/WindowButtons/maximize-white.png)')
            $(document.body).find(".windowbutton-extensions").css('background-image', 'url(img/apps-white.png)')
            $(document.body).find(".addTabBtn").css('color', '#fff')
        } else {
            $(document.body).find(".windowbutton-close").css('background-image', 'url(img/WindowButtons/close.png)')
            $(document.body).find(".windowbutton-minimize").css('background-image', 'url(img/WindowButtons/minimize.png)')
            $(document.body).find(".windowbutton-maximize").css('background-image', 'url(img/WindowButtons/maximize.png)')
            $(document.body).find(".windowbutton-extensions").css('background-image', 'url(img/apps-black.png)')
            $(document.body).find(".addTabBtn").css('color', '#444')
        }
        for (var i = 0; i < tabCollection.length; i++) {
            if (Foreground == "#fff") {
                borderColor = "rgba(255,255,255,0.2)";
                tabCollection[i].Tab.css('border-left', '1px solid rgba(255,255,255,0.1)')
                tabCollection[i].Tab.css('border-right', '1px solid rgba(255,255,255,0.1)')
                tabCollection[i].Tab.css('border-bottom', '1px solid rgba(255,255,255,0.1)')
                $('.border5').css('background-color', 'rgba(255,255,255,0.1)');
            } else {
                borderColor = "rgba(0,0,0,0.2)";
                tabCollection[i].Tab.css('border-left', '1px solid rgba(0,0,0,0.1)')
                tabCollection[i].Tab.css('border-right', '1px solid rgba(0,0,0,0.1)')
                tabCollection[i].Tab.css('border-bottom', '1px solid rgba(0,0,0,0.1)')
                $('.border5').css('background-color', 'rgba(0,0,0,0.1)');
            }

            if (!tabCollection[i].selected) {
                normalColor = color
                tabCollection[i].Tab.css('background-color', normalColor)
                if (Foreground == "#fff") {
                    tabCollection[i].closeBtn.find('.closeBtnImg').css('background-image', 'url("img/close-white.png")')
                } else {
                    tabCollection[i].closeBtn.find('.closeBtnImg').css('background-image', 'url("img/close.png")')
                }
                tabCollection[i].Title.css('color', Foreground)
            }
        }
    }

    globalShortcut.unregisterAll();
})();