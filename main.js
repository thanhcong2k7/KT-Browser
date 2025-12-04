const electron = require('electron')
const protocol = electron.protocol
const app = electron.app
const { ipcMain, BrowserWindow } = electron
const path = require('path')
const fs = require('fs')
// 'electron-is-dev' is ESM only now. Use !app.isPackaged instead.
const isDev = !app.isPackaged 
const settings = require('electron-settings')
const windowStateKeeper = require('electron-window-state')

// Initialize remote module
require('@electron/remote/main').initialize() 

global.startArgs = {
    data: process.argv
}

// Ensure User Data folder exists on Windows
if(process.platform == 'win32') {
    const userDataPath = app.getPath('userData');
    if(!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
}

// USE getSync / setSync for electron-settings v4+
if(settings.getSync("static") == null) {
    settings.setSync('static', {
        NightMode: false,
        VPN: false
    })
}

if(settings.getSync('settings.nvProxy') == null) {
    settings.setSync('settings.nvProxy', 'http://kt-browser.com/Singapore.pac');
}

if(settings.getSync('settings.homePage') == null) {
    settings.setSync('settings.homePage', 'kt-browser://newtab');
}

if(settings.getSync('settings.SearchEngine') == null) {
    settings.setSync('settings.SearchEngine', '1');
}

if(settings.getSync('settings.colorByPage') == null) {
    settings.setSync('settings.colorByPage', true);
}

if(settings.getSync('settings.blockUnsafeWeb') == null) {
    settings.setSync('settings.blockUnsafeWeb', true);
}

if(settings.getSync('settings.DNT') == null) {
    settings.setSync('settings.DNT', true);
}

if(settings.getSync('settings.allowScript') == null) {
    settings.setSync('settings.allowScript', true);
}

if(settings.getSync('settings.allowImage') == null) {
    settings.setSync('settings.allowImage', true);
}

if(settings.getSync('settings.blockads') == null) {
    settings.setSync('settings.blockads', true);
}

if(settings.getSync('settings.labanDic') == null) {
    settings.setSync('settings.labanDic', true);
}

if(settings.getSync('settings.macRender') == null) {
    settings.setSync('settings.macRender', false);
}

if(settings.getSync('settings.hardalc') == null) {
    settings.setSync('settings.hardalc', true);
}

if(settings.getSync('settings.closeOnLastTab') == null) {
    settings.setSync('settings.closeOnLastTab', true);
}

if(settings.getSync('static.NightMode') == null) {
    settings.setSync('static.NightMode', false);
}

if(settings.getSync('static.VPN') == null) {
    settings.setSync('static.VPN', false);
}

if(!settings.getSync("settings.hardalc")) {
    app.disableHardwareAcceleration();
}

app.commandLine.appendSwitch('enable-pdf-material-ui', '')
app.commandLine.appendSwitch('enable-media-stream', '')
app.commandLine.appendSwitch('enable-speech-input', '')
app.commandLine.appendSwitch('enable-fast-unload', '')
app.commandLine.appendSwitch('smooth-scrolling', 'enabled')
app.commandLine.appendSwitch('touch-events', 'enabled')

process.env.GOOGLE_API_KEY = 'AIzaSyDwr302FpOSkGRpLlUpPThNTDPbXcIn_FM'
process.env.GOOGLE_DEFAULT_CLIENT_ID = '413772536636.apps.googleusercontent.com'
process.env.GOOGLE_DEFAULT_CLIENT_SECRET = '0ZChLK6AxeA3Isu96MkwqDR4'

let mainWindow

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 768
    })
    mainWindow = new BrowserWindow({
        title: 'KT Browser',
        'minWidth': 640,
        'minHeight': 480,
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        backgroundColor: '#fff',
        icon: `file://${__dirname}/icon.ico`,
        frame: false,
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            enableRemoteModule: true,
            webSecurity: false
        }
    })

    // Enable remote for this window
    require('@electron/remote/main').enable(mainWindow.webContents)

    mainWindow.once('ready-to-show', () => {
        mainWindow.fullscreen = false;
    })
    mainWindow.on('enter-html-full-screen', function() {
        mainWindow.webContents.executeJavaScript('Toast_Material({content:"Press F11 to exit fullscreen",updown:"bottom",position:"center",align:"center"});', true)
        mainWindow.webContents.executeJavaScript("titlebar.style.display='none';", true)
    });
    mainWindow.on('leave-html-full-screen', function() {
        mainWindow.webContents.executeJavaScript("titlebar.style.display='block';", true)
    });
    mainWindow.on('enter-full-screen', function() {
        if(process.platform !== 'linux') {
            mainWindow.webContents.executeJavaScript('Toast_Material({ content : "Press F11 to exit fullscreen", updown:"bottom", position:"center", align:"center" });', true)
        }
        mainWindow.webContents.executeJavaScript("titlebar.style.display='none';", true)
    });
    mainWindow.on('leave-full-screen', function() {
        mainWindow.webContents.executeJavaScript("titlebar.style.display='block';", true)
    });

    mainWindow.loadURL(`file://${__dirname}/index.html`)
    if(isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.on('closed', function() {
        mainWindow = null
    })
    mainWindow.setMenu(null)
    
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        // Fix itemURL reference
        const itemURL = item.getURL();
        if(item.getMimeType() === 'application/pdf' && itemURL.indexOf('blob:') !== 0) {
            event.preventDefault()
            // Note: This assumes `Tab` and `addTab` are available in the main process context 
            // or this logic should be moved/ipc used. 
            // For now, we keep structure, but this specific block might need refactoring 
            // if Tab is a renderer class.
        }
    })

    if(settings.getSync('settings.DNT')) {
        const filter = {
            urls: ["http://*/*", "https://*/*"]
        }
        mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            details.requestHeaders['DNT'] = "1";
            callback({
                cancel: false,
                requestHeaders: details.requestHeaders
            })
        })
    }
    mainWindowState.manage(mainWindow)
}

process.on('uncaughtException', function(error) {
    console.error(error);
})

protocol.registerSchemesAsPrivileged([
    { scheme: 'kt-browser', privileges: { standard: true, secure: true, supportFetchAPI: true } }
])

app.on('ready', function() {
    protocol.registerFileProtocol('kt-browser', (request, callback) => {
        var url = request.url.substr(13)
        var lastChar = url.substr(url.length - 1)
        var s = url.split("/");
        if(lastChar != "/") {
            url = url.replace(s[0], "")
        }
        if(lastChar == "/") {
            url = url.substring(0, url.length - 1)
            url += ".html"
        }
        callback({
            path: path.normalize(`${__dirname}/${url}`)
        })
    }, (error) => {
        if (error) console.error('Failed to register protocol');
    })
    createWindow();
});

app.on('window-all-closed', function() {
    if(process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    if(mainWindow === null) {
        createWindow()
    }
})

app.setName('KT Browser')
/*
try {
    var client = require('electron-connect').client;
    client.create(mainWindow);
} catch (e) {
    console.log("Electron connect not loaded (dev only)")
}
*/
global.sharedObj = {
    prop1: "siema"
};