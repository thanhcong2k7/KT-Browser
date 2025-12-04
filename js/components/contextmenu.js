(function() {
    const remote = require('@electron/remote');
    const {Menu, MenuItem, clipboard} = remote;

    class ContextMenu {
        constructor(webview) {
            var t = this
            this.webview = webview
            this.linkToOpen = ''
            this.imageToSave = ''
            this.selectionText = ''
            this.xToInspect = null
            this.yToInspect = null
            this.menu = new Menu()
            this.prepareContextMenu()

            $(webview).ready(function () {
                webview.addEventListener('context-menu', (e, params) => {
                    e.preventDefault()

                    if (!params.isEditable) {
                        t.undoMenuItem.visible = false
                        t.redoMenuItem.visible = false
                        t.cutMenuItem.visible = false
                        t.copyMenuItem.visible = false
                        t.pasteMenuItem.visible = false
                        t.deleteMenuItem.visible = false
                        t.selectAllMenuItem.visible = false
                        t.imageToSave = ''
                        t.linkToOpen = ''
                        
                        if (params.mediaType == 'image') {
                            t.imageToSave = params.srcURL
                        }

                        t.linkToOpen = params.linkURL

                        if (t.linkToOpen == '') {
                            t.openLinkInNewTabMenuItem.visible = false
                            t.copyLinkMenuItem.visible = false
                        } else {
                            t.openLinkInNewTabMenuItem.visible = true
                            t.copyLinkMenuItem.visible = true
                        }

                        if (t.imageToSave == '') {
                            t.saveImageAsMenuItem.visible = false
                            t.openImageInNewTabMenuItem.visible = false
                        } else {
                            t.saveImageAsMenuItem.visible = true
                            t.openImageInNewTabMenuItem.visible = true
                        }

                        if (t.imageToSave == "" && t.linkToOpen == "") {
                            t.backMenuItem.visible = true
                            t.forwardMenuItem.visible = true
                            t.refreshMenuItem.visible = true
                            t.printMenuItem.visible = true
                        } else {
                            t.backMenuItem.visible = false
                            t.forwardMenuItem.visible = false
                            t.refreshMenuItem.visible = false
                            t.printMenuItem.visible = false
                        }

                        if (webview.canGoBack()) {
                            t.backMenuItem.enabled = true
                        } else {
                            t.backMenuItem.enabled = false
                        }
                        if (webview.canGoForward()) {
                            t.forwardMenuItem.enabled = true
                        } else {
                            t.forwardMenuItem.enabled = false
                        }
                    } else {
                        t.undoMenuItem.visible = true
                        t.undoMenuItem.enabled = params.editFlags.canUndo

                        t.redoMenuItem.visible = true
                        t.redoMenuItem.enabled = params.editFlags.canRedo

                        t.cutMenuItem.visible = true
                        t.cutMenuItem.enabled = params.editFlags.canCut

                        t.copyMenuItem.visible = true
                        t.copyMenuItem.enabled = params.editFlags.canCopy

                        t.pasteMenuItem.visible = true
                        t.pasteMenuItem.enabled = params.editFlags.canPaste

                        t.deleteMenuItem.visible = true
                        t.deleteMenuItem.enabled = params.editFlags.canDelete

                        t.selectAllMenuItem.visible = true
                        t.selectAllMenuItem.enabled = params.editFlags.canSelectAll

                        t.backMenuItem.visible = false
                        t.forwardMenuItem.visible = false
                        t.refreshMenuItem.visible = false
                        t.openLinkInNewTabMenuItem.visible = false
                        t.copyLinkMenuItem.visible = false
                        t.backMenuItem.visible = false
                        t.forwardMenuItem.visible = false
                        t.refreshMenuItem.visible = false
                        t.printMenuItem.visible = false
                    }
                    
                    if (!params.selectionText == "" && params.selectionText.length < 100)
                    {
                        t.TTSMenuItem.visible = true
                    } else {
                        t.TTSMenuItem.visible = false
                    }

                    t.selectionText = params.selectionText

                    t.xToInspect = params.x
                    t.yToInspect = params.y
                                        
                    t.menu.popup(remote.getCurrentWindow())
                }, true)
            })

        }

        prepareContextMenu() {
            var t = this
            t.TTSMenuItem = new MenuItem({
                label: 'Read text...',
                click() {
                    require('google-tts-api')(t.selectionText, 'vi', 1).then(function (url) {
                        console.log(url);
                        var audio = new Audio();
                        audio.src = url;
                        audio.play();
                    })
                    .catch(function (err) {
                        console.error(err.stack);
                    });
                }
            })
            t.backMenuItem = new MenuItem({
                label: 'Back',
                click() {
                    t.webview.goBack()
                }
            })
            t.forwardMenuItem = new MenuItem({
                label: 'Forward',
                click() {
                    t.webview.goForward()
                }
            })
            t.refreshMenuItem = new MenuItem({
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click() {
                    t.webview.reload()
                }
            })
            t.openLinkInNewTabMenuItem = new MenuItem({
                label: 'Open link in new tab',
                click() {
                    if (t.linkToOpen != "") {
                        var tab = new Tab(),
                            instance = $('#instances').browser({
                                tab: tab,
                                url: t.linkToOpen
                            })
                        addTab(instance, tab);
                    }
                }
            })
            t.openImageInNewTabMenuItem = new MenuItem({
                label: 'Open image in new tab',
                click() {
                    if (t.imageToSave != "") {
                        var tab = new Tab(),
                            instance = $('#instances').browser({
                                tab: tab,
                                url: t.imageToSave
                            })
                        addTab(instance, tab);
                    }
                }
            })
            t.copyLinkMenuItem = new MenuItem({
                label: 'Copy link address',
                click() {
                    if (t.linkToOpen != "") {
                        clipboard.writeText(t.linkToOpen)
                    }
                }
            })
            t.saveImageAsMenuItem = new MenuItem({
                label: 'Save image as...',
                click() {
                    t.webview.downloadURL(t.imageToSave)
                }
            })
            t.printMenuItem = new MenuItem({
                label: 'Print',
                accelerator: 'CmdOrCtrl+P',
                click() {
                    t.webview.print({
                        silent: false,
                        printBackground: false
                    })
                }
            })
            t.inspectElementMenuItem = new MenuItem({
                label: 'Inspect',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() {
                    t.webview.inspectElement(t.xToInspect, t.yToInspect)
                }
            })
            t.separator1 = new MenuItem({
                type: 'separator'
            })
            t.separator2 = new MenuItem({
                type: 'separator'
            })

            t.undoMenuItem = new MenuItem({
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                click() {
                    t.webview.undo()
                }
            })
            t.redoMenuItem = new MenuItem({
                label: 'Redo',
                accelerator: 'CmdOrCtrl+Shift+Z',
                click() {
                    t.webview.redo()
                }
            })
            t.cutMenuItem = new MenuItem({
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                click() {
                    t.webview.cut()
                }
            })
            t.copyMenuItem = new MenuItem({
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                click() {
                    t.webview.copy()
                }
            })
            t.pasteMenuItem = new MenuItem({
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                click() {
                    t.webview.paste()
                }
            })
            t.deleteMenuItem = new MenuItem({
                label: 'Delete',
                accelerator: 'Delete',
                click() {
                    t.webview.delete()
                }
            })
            t.selectAllMenuItem = new MenuItem({
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                click() {
                    t.webview.selectAll()
                }
            })

            this.menu.append(t.TTSMenuItem)
            this.menu.append(t.undoMenuItem)
            this.menu.append(t.redoMenuItem)
            this.menu.append(t.openLinkInNewTabMenuItem)
            this.menu.append(t.openImageInNewTabMenuItem)
            this.menu.append(t.backMenuItem)
            this.menu.append(t.forwardMenuItem)
            this.menu.append(t.refreshMenuItem)
            this.menu.append(t.separator1)
            this.menu.append(t.cutMenuItem)
            this.menu.append(t.copyMenuItem)
            this.menu.append(t.pasteMenuItem)
            this.menu.append(t.deleteMenuItem)
            this.menu.append(t.selectAllMenuItem)
            this.menu.append(t.copyLinkMenuItem)
            this.menu.append(t.saveImageAsMenuItem)
            this.menu.append(t.printMenuItem)
            this.menu.append(t.separator2)
            this.menu.append(t.inspectElementMenuItem)
        }
    }
    
    // Expose to window
    window.ContextMenu = ContextMenu;
})();