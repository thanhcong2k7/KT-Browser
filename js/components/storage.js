(function() {
    const fs = require('fs');
    const remote = require('@electron/remote');
    const { app } = remote;

    // Ensure paths are available if not global
    var historyPath = window.historyPath || app.getPath('userData') + '/User Data/History';
    var bookmarkPath = window.bookmarkPath || app.getPath('userData') + '/User Data/Bookmarks';

    class Storage {
        constructor() {

        }

        saveHistory(title, url) {
            if (title != null && url != null) {

                var array;
                //get today's date
                var today = new Date(),
                    dd = today.getDate(),
                    mm = today.getMonth() + 1,
                    yyyy = today.getFullYear()
                if (dd < 10) {
                    dd = '0' + dd
                }

                if (mm < 10) {
                    mm = '0' + mm
                }
                today = mm + '-' + dd + '-' + yyyy

                fs.readFile(historyPath, function (err, data) {
                    if (err) {
                        // Handle error or init file
                        return; 
                    }
                    var json = data.toString()
                    //replace weird characters in utf-8
                    json = json.replace("\ufeff", "")
                    var obj;
                    try {
                        obj = JSON.parse(json)
                    } catch (e) {
                        obj = { history: [] };
                    }
                    
                    if (!url.startsWith("kt-browser://") && !url.startsWith("about:blank")) {
                        var date = new Date()
                        var current_hour = date.getHours()
                        var current_minute = date.getMinutes()
                        var time = `${current_hour}:${current_minute}`
                        
                        if (!obj['history']) obj['history'] = [];

                        if (obj['history'].length === 0) {
                            obj['history'].push({
                                "link": url,
                                "title": title,
                                "date": today,
                                "time": time,
                                "id": 0
                            });
                        } else {
                            obj['history'].push({
                                "link": url,
                                "title": title,
                                "date": today,
                                "time": time,
                                "id": obj['history'][obj['history'].length - 1].id + 1
                            });
                        }
                        var jsonStr = JSON.stringify(obj)
                        json = jsonStr
                        fs.writeFile(historyPath, json, function (err) {
                            if (err) {
                                return true
                            }
                        })
                    }
                })
            }
        }

        saveBookmark(title, url) {
            if (title != null && url != null) {
                var array;
                fs.readFile(bookmarkPath, function (err, data) {
                     if (err) {
                        // Handle error
                        return; 
                    }
                    var json = data.toString()
                    json = json.replace("\ufeff", "")
                    var obj;
                    try {
                         obj = JSON.parse(json)
                    } catch(e) {
                        obj = { bookmark: [] };
                    }

                    if (!url.startsWith("kt-browser://") && !url.startsWith("about:blank")) {
                        if (!obj['bookmark']) obj['bookmark'] = [];
                        
                        if (obj['bookmark'].length === 0) {
                            obj['bookmark'].push({
                                "link": url,
                                "title": title,
                                "id": 0
                            });
                        } else {
                            obj['bookmark'].push({
                                "link": url,
                                "title": title,
                                "id": obj['bookmark'][obj['bookmark'].length - 1].id + 1
                            });
                        }
                        var jsonStr = JSON.stringify(obj)
                        json = jsonStr
                        fs.writeFile(bookmarkPath, json, function (err) {
                            if (err) {
                                return true
                            }
                        })
                    }
                })
            }
        }
    }
    
    // Expose to window
    window.Storage = Storage;
})();