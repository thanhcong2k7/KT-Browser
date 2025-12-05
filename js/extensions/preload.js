const electron = require('electron');
const remote = require('@electron/remote');

// CRITICAL FIX: Polyfill electron.remote globally for all subsequent requires
// This fixes 'electron-connect' and 'electron-settings' errors
if (!electron.remote) {
    electron.remote = remote;
}

const { ipcRenderer } = electron;
const { app } = remote;
const settings = require('electron-settings');
const fs = require('fs');

var window = remote.getCurrentWindow();
var historyPath = app.getPath('userData') + '/User Data/History';
var userdataPath = app.getPath('userData') + '/User Data';

global.getHistoryData = function () {
    if (!fs.existsSync(historyPath)) {
        return { history: [] };
    }
    try {
        return JSON.parse(fs.readFileSync(historyPath));
    } catch (e) {
        return { history: [] };
    }
	return JSON.parse(fs.readFileSync(historyPath));
}

global.isfullscreen = function () {
	return window.isFullScreen();
}

global.setfullscreen = function (flag) {
	return window.setFullScreen(flag);
}

global.isNightMode = function () {
	return settings.getSync("static.NightMode");
}

global.LaBanDic = function () {
	return settings.getSync("settings.labanDic");
}

global.isMacRender = function () {
	return settings.getSync("settings.macRender");
}

global.getSearchEngine = function () {
    return settings.getSync('settings.SearchEngine');
}

global.setNightMode = function (flag) {
	window.webContents.executeJavaScript('setNightMode(' + flag + ')', true);
}

global.setTitleBarColor = function (color) {
	window.webContents.executeJavaScript('titlebar.style.background="' + color + '"', true);
	window.webContents.executeJavaScript("setColor('" + color + "')", true);
}

global.saveHistory = function (json) {
	fs.writeFile(historyPath, json, function (err) {
		if (err) {
			return true;
		}
	});
}

global.removeHistory = function (callback = function () {}) {
	fs.unlink(historyPath, callback);
}

global.addressBarFocus = function () {
	for (var i = 0; i < parent.tabCollection.length; i++) {
		if (parent.tabCollection[i].selected) {
			var itab = parent.tabCollection[i]
			$(itab.tabWindow.find('.searchInput')).focus();
		}
	}
}

global.getReaderScore = function () {
  var paragraphs = document.querySelectorAll('p')
  var tl = 0
  if (!paragraphs) {
    return
  }
  for (var i = 0; i < paragraphs.length; i++) {
    tl += Math.max(paragraphs[i].textContent.length - 100, -30)
  }
  return tl
}


global.MacRender = function () {
	var css = [
		"@namespace url(http://www.w3.org/1999/xhtml);",
		"body, input, .navigator-toolbox, .toolbarbutton-text, .sidebar-title{",
		"text-shadow: 0px 0px 1px #ACACAC;",
		"}"
	].join("\n");
	if (typeof GM_addStyle != "undefined") {
		GM_addStyle(css);
	} else if (typeof PRO_addStyle != "undefined") {
		PRO_addStyle(css);
	} else if (typeof addStyle != "undefined") {
		addStyle(css);
	} else {
		var node = document.createElement("style");
		node.type = "text/css";
		node.appendChild(document.createTextNode(css));
		var heads = document.getElementsByTagName("head");
		if (heads.length > 0) {
			heads[0].appendChild(node);
		} else {
			document.documentElement.appendChild(node);
		}
	}
}

document.addEventListener("click", function () {
	ipcRenderer.sendTo('host', "clicked");
})

function setStatus(status) {
	ipcRenderer.sendTo('host','status', status);
}

global.stylishMenu = function () {
	var css = [
		"::-webkit-scrollbar{",
		"    width:9px;",
		"    background-color:#f1f1f1;",
		"",
		"}",
		"",
		"body::-webkit-scrollbar{",
		"    width:10px!important;",
		"    background-color:#EEEEEE;",
		"}",
		"",
		"::-webkit-scrollbar-track{",
		"    border: 9px;",
		"}",
		"",
		"body::-webkit-scrollbar-track{",
		"    ",
		"    border: none;",
		"}",
		"",
		"::-webkit-scrollbar-thumb{",
		"    background-color:#424242!important;",
		"    border-radius:0px!important;",
		"    border: none;",
		"}",
		"::-webkit-scrollbar-thumb:hover{",
		"    background-color:#333!important;",
		"    ",
		"}",
		"::-webkit-scrollbar-thumb:active{",
		"    background-color:#616161!important;",
		"    ",
		"}"
	].join("\n");
	if (typeof GM_addStyle != "undefined") {
		GM_addStyle(css);
	} else if (typeof PRO_addStyle != "undefined") {
		PRO_addStyle(css);
	} else if (typeof addStyle != "undefined") {
		addStyle(css);
	} else {
		var node = document.createElement("style");
		node.type = "text/css";
		node.appendChild(document.createTextNode(css));
		var heads = document.getElementsByTagName("head");
		if (heads.length > 0) {
			heads[0].appendChild(node);
		} else {
			document.documentElement.appendChild(node);
		}
	}
}

global.NightMode = function () {
	var css = "";
	css += "@charset \"utf-8\";";
	if (false || (document.location.href.indexOf("http://") == 0) || (document.location.href.indexOf("https://") == 0) || (document.location.href.indexOf("ftp://") == 0))
		css += [
            // CSS content
		].join("\n");
	if (typeof GM_addStyle != "undefined") {
		GM_addStyle(css);
	} else if (typeof PRO_addStyle != "undefined") {
		PRO_addStyle(css);
	} else if (typeof addStyle != "undefined") {
		addStyle(css);
	} else {
		var node = document.createElement("style");
		node.type = "text/css";
		node.appendChild(document.createTextNode(css));
		var heads = document.getElementsByTagName("head");
		if (heads.length > 0) {
			heads[0].appendChild(node);
		} else {
			document.documentElement.appendChild(node);
		}
	}
}

document.addEventListener('mouseover', function (e) {
	var el = e.target
	while (el) {
		if (el.tagName == 'A') {
			if (el.getAttribute('title'))
				setStatus(el.getAttribute('title'))
			else if (el.href)
				setStatus(el.href)
			return
		}
		el = el.parentNode
	}
	setStatus(false)
})