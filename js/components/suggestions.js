(function ($) {
     const remote = require('@electron/remote');
     const { globalShortcut } = remote;
     
     // Ensure historyPath is available
     const { app } = remote;
     var historyPath = window.historyPath || app.getPath('userData') + '/User Data/History';

     $.fn.suggestions = function (params) {
         var settings = $.extend({
                 searchInput: null
                 , tab: null
             }, params)
             , tGlobal = this
             // webview might not be ready immediately, access dynamically or safely
             , webview = settings.tab.instance.webview.webview
             , t = this

         this.suggestionsUl = $('<ul class="suggestions-ul">')
             .appendTo($(this))

         globalShortcut.register('Esc', () => {
             if (remote.getCurrentWindow()
                 .isFocused())
                 t.hide();
         });

         settings.searchInput.on("input", function (e) {

             var key = event.keyCode || event.charCode;

             if (key != 40 && key != 38) {

                 var inputText = settings.searchInput.val()
                     .toLowerCase()
                     .replace(getSelectionText(), "");
                 if (inputText != "") {
                     $(t)
                         .css('display', 'block');
                     $.ajax({
                         type: "GET"
                         , url: historyPath
                         , success: function (data) {
                             var json = data.toString();

                             json = json.replace("﻿", "");
                             var obj = JSON.parse(json);
                             if (inputText != "") {
                                 var links = [];
                                 for (var i = 0; i < obj.history.length; i++) {
                                     var str = obj.history[i].link;
                                     if (str.startsWith("http://")) {
                                         str = str.split("http://")[1];
                                         if (str.startsWith("www.")) {
                                             str = str.split("www.")[1];
                                         }
                                     }
                                     if (str.startsWith("https://")) {
                                         str = str.split("https://")[1];
                                         if (str.startsWith("www.")) {
                                             str = str.split("www.")[1];
                                         }
                                     }
                                     var lastChar = str.substr(str.length - 1);
                                     if (str.split('/')
                                         .length == 2 && lastChar == "/") {
                                         str = str.replace('/', '');
                                     }

                                     if (!(str.indexOf("google") !== -1 && str.indexOf("search?q=") !== -1)) {
                                         if (str.startsWith(inputText)) {
                                             links.push(str);
                                         }
                                     }
                                 }

                                 if (links.length > 0) {

                                     var oldLink = links.sort(function (a, b) {
                                         return a.length - b.length;
                                     })[0];
                                     var newLink = links.sort(function (a, b) {
                                         return a.length - b.length;
                                     })[0];

                                     newLink = newLink.substr(0, newLink.indexOf('/'));
                                     if (oldLink != newLink) {
                                         links.push(newLink);
                                     }
                                     links.sort(function (a, b) {
                                         return b.length - a.length;
                                     });
                                     for (var i = 0; i < links.length; i++) {
                                         if (links[i] == "") {
                                             links.splice(i, 1)
                                         }
                                         if (links[i] != null) {
                                             var a = links[i].length - inputText.length;
                                             if (a > -1) {
                                                 var s = links[i];
                                                 links.splice(i, 1)
                                                 links.unshift(s)
                                             }
                                         }
                                     }
                                     var uniqueLinks = [];
                                     $.each(links, function (i, el) {
                                         if ($.inArray(el, uniqueLinks) === -1) uniqueLinks.push(el)
                                     });
                                     if (uniqueLinks.length > 3) {
                                         uniqueLinks.length = 3;
                                     }
                                     var finalLength = uniqueLinks.length;
                                     if (finalLength > 3) {
                                         finalLength = 3;
                                     }
                                     if (finalLength < 0) {
                                         finalLength = 0;
                                     }
                                     while ($(t)
                                         .find('.history')
                                         .length < finalLength) {
                                         var s = $('<li data-ripple-color="#444" class="suggestions-li ripple history" link=""></li>')
                                             .prependTo($(tGlobal.suggestionsUl));
                                         s.click(function (e) {
                                             webview.loadURL('http://' + $(this)
                                                 .attr('link'));
                                         });
                                         s.mousedown(function (e) {
                                             var relX = e.pageX - $(this)
                                                 .offset()
                                                 .left;
                                             var relY = e.pageY - $(this)
                                                 .offset()
                                                 .top;
                                             Ripple.makeRipple($(this), relX, relY, $(this)
                                                 .width(), $(this)
                                                 .height(), 800, 0);
                                         });
                                         s.mouseover(function () {
                                             $(t)
                                                 .find('.suggestions-li')
                                                 .removeClass("selected");
                                             $(this)
                                                 .addClass("selected");
                                             settings.searchInput.val($(this)
                                                 .attr('link'));
                                         });

                                     }
                                     while ($(t)
                                         .find('.history')
                                         .length > finalLength) {
                                         $(t)
                                             .find('.history')
                                             .first()
                                             .remove()
                                     }
                                     $(t)
                                         .find('.history')
                                         .each(function (i) {
                                             $(this)
                                                 .html(uniqueLinks[i]);
                                             $(this)
                                                 .attr('link', uniqueLinks[i]);
                                         })

                                     if (canSuggest) {
                                         autocomplete(settings.searchInput, uniqueLinks[0]);
                                         canSuggest = false;
                                     }
                                 } else {
                                     $(t)
                                         .find('.history')
                                         .each(function (i) {
                                             $(this)
                                                 .remove();
                                         });
                                 }

                             } else {
                                 $(t)
                                     .find('.history')
                                     .each(function (i) {
                                         $(this)
                                             .remove();
                                     });
                             }
                             var t1 = $($(t)
                                 .find('.suggestions-li'));
                             t1.removeClass('selected');
                             t1.first()
                                 .addClass("selected");

                         }
                         , complete: function () {
                             $(t)
                                 .css('display', 'block');
                             if (inputText != "" || inputText != null || typeof inputText !== "undefined") {
                                 $.ajax({
                                     type: "GET"
                                     , url: "http://google.com/complete/search?client=firefox&q=" + inputText
                                     , success: function (data) {
                                         var obj = JSON.parse(data);
                                         var links = [];
                                         for (var i = 0; i < obj[1].length; i++) {
                                             if (!isInArray(obj[1][i], links)) {
                                                 links.push(obj[1][i]);
                                             }
                                         }
                                         if (links.length > 0) {

                                         }
                                         var uniqueLinks = [];
                                         $.each(links, function (i, el) {
                                             if ($.inArray(el, uniqueLinks) === -1) uniqueLinks.push(el);
                                         });
                                         uniqueLinks.sort(function (a, b) {
                                             return a.length - b.length;
                                         });
                                         if (uniqueLinks.length > 3) {
                                             uniqueLinks.length = 3;
                                         }
                                         var finalLength = uniqueLinks.length;
                                         if (finalLength > 3) {
                                             finalLength = 3;
                                         }
                                         if (finalLength < 0) {
                                             finalLength = 0;
                                         }
                                         while ($(t)
                                             .find('.internet')
                                             .length < finalLength) {
                                             var s = $('<li data-ripple-color="#444" class="suggestions-li ripple internet" link=""></li>')
                                                 .appendTo($(tGlobal.suggestionsUl));
                                             s.click(function (e) {
                                                 switch (getSearchEngine()) {
                                                 case "1":
                                                     webview.loadURL("http://www.google.com.vn/search?q=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 case "2":
                                                     webview.loadURL("http://coccoc.com/search#query=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 case "3":
                                                     webview.loadURL("https://duckduckgo.com/?q=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 case "4":
                                                     webview.loadURL("https://www.bing.com/search?q=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 case "5":
                                                     webview.loadURL("https://search.yahoo.com/search?p=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 case "6":
                                                     webview.loadURL("https://www.yandex.com/search/?text=" + $(this)
                                                         .attr('link'));
                                                     break;
                                                 }

                                             });
                                             s.mousedown(function (e) {
                                                 var relX = e.pageX - $(this)
                                                     .offset()
                                                     .left;
                                                 var relY = e.pageY - $(this)
                                                     .offset()
                                                     .top;
                                                 Ripple.makeRipple($(this), relX, relY, $(this)
                                                     .width(), $(this)
                                                     .height(), 600, 0);
                                             });
                                             s.mouseover(function () {
                                                 $(t)
                                                     .find('.suggestions-li')
                                                     .removeClass("selected");
                                                 $(this)
                                                     .addClass("selected");
                                                 settings.searchInput.val($(this)
                                                     .attr('link'));
                                             });
                                         }
                                         while ($(t)
                                             .find('.internet')
                                             .length > finalLength) {
                                             $(t)
                                                 .find('.internet')
                                                 .first()
                                                 .remove()
                                         }
                                         $(t)
                                             .find('.internet')
                                             .each(function (i) {
                                                 $(this)
                                                     .html(uniqueLinks[i]);
                                                 $(this)
                                                     .attr('link', uniqueLinks[i]);
                                             })

                                     }
                                 });
                             }
                         }
                     });
                 }
             }

         });
         var canSuggest = false;
         settings.searchInput[0].onkeydown = function () {
             var key = event.keyCode || event.charCode;
             //blacklist: backspace, enter, ctrl, alt, shift, tab, caps lock, delete, space
             if (key != 8 && key != 13 && key != 17 && key != 18 && key != 16 && key != 9 && key != 20 && key != 46 && key != 32) {
                 canSuggest = true;
             }
         }

         settings.searchInput.keydown(function (e) {
             var selected = $(t)
                 .find(".selected")
             if (e.keyCode == 38) {
                 e.preventDefault();
                 settings.searchInput.select();
                 settings.searchInput.val(selected.prev()
                     .attr('link'));

                 $(t)
                     .find('.suggestions-li')
                     .removeClass("selected");
                 if (selected.prev()
                     .length == 0) {
                     selected.first()
                         .addClass("selected");
                     settings.searchInput.val(selected.first()
                         .attr('link'));
                 } else {
                     selected.prev()
                         .addClass("selected");
                 }
                 settings.searchInput.select();
             }
             if (e.keyCode == 40) {
                 e.preventDefault();
                 settings.searchInput.select();
                 settings.searchInput.val(selected.next()
                     .attr('link'));

                 $(t)
                     .find('.suggestions-li')
                     .removeClass("selected");
                 if (selected.next()
                     .length == 0) {
                     selected.last()
                         .addClass("selected");
                     settings.searchInput.val(selected.last()
                         .attr('link'));
                 } else {
                     selected.next()
                         .addClass("selected");
                 }
                 settings.searchInput.select();

             }

         });
         setInterval(function () {
             if (settings.searchInput.val() == "" || settings.searchInput.val() == null) {
                 $(t)
                     .css('display', 'none')
                 $(t)
                     .find('.suggestions-li')
                     .each(function (i) {
                         $(this)
                             .remove()
                     });
             }
         }, 1);
         $(window)
             .click(function () {
                 $(t)
                     .css('display', 'none');
             })
         return this
     }

 }(jQuery))