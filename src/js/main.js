/**
 * External modules + node modules
 */
const app = require('electron').remote;
const remote = app;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const dialog = app.dialog;
const fs = require("fs");
const os = require('os');
const { spawn } = require('child_process');
const process = require('process');
const { ipcRenderer } = require('electron');

/**
 * SCode internal modules
 */
var editor = require(__dirname + "/js/editor").init();
var terminal = require(__dirname + "/js/terminal");
var tabmanager = require(__dirname + "/js/tabs");


/**
 * SCode init
 */
var tabs = {}, id = 0, active_document = null, settings, folder, folder_status, language, first_use;

$(document).ready(function () {
    first_use = editor.verifyInstallation()
    settings = editor.load('settings');
    folder = editor.load('working_dir');
    folder_status = editor.load('folders');
    editor.load("tabs");
    editor.setStyle();
    language = editor.load("translations")
    editor.addFunctionalities();
});
/* ------------------------------------------------------- */
var scode_fast_action = function () {

    this.show = function (callback, default_text, commands) {

        var e = $('body').child('div');
        e.addClass('action-helper');

        var text = e.child("input");
        var options = e.child("div");

        if (default_text != undefined) {
            text.get(0).value = default_text;
        }
        text.get(0).focus();
        var index_seleted = -1;
        text.get(0).onkeydown = function (event) {
            if (event.keyCode == 27) {
                try {
                    e.remove();
                } catch (error) {
                    //console.log(error);
                }
            } else if (event.keyCode === 13) {
                if (commands != undefined) {
                    var child = options.get(0).querySelector('.selected');
                    child.click();
                } else {
                    if (callback(text.get(0).value, text)) {
                        e.remove();
                    }
                }
                return false;
            } else if (event.keyCode === 9) {
                e.remove();
                //console.log('e');
                return false;
            } else if (event.keyCode === 40 || event.keyCode === 38) {
                var childs = options.get(0).querySelectorAll('div');
                for (var i = 0; i < childs.length; i++) {
                    var child = childs[i];
                    $(child).removeClass('selected');
                }
                if (event.keyCode === 40) {
                    index_seleted++;
                } else {
                    index_seleted--;
                }
                if (index_seleted >= childs.length || index_seleted < 0) {
                    index_seleted = 0;
                }
                childs[index_seleted].classList.add('selected')
                return false;
            }

        }

        text.get(0).oninput = function () {
            if (commands != undefined) {
                options.html('');
                actual = "";
                var x_val = text.get(0).value.split('');
                for (var i = 0; i < x_val.length; i++) {
                    var c = x_val[i];
                    actual += c + "(.*)";
                }
                for (var i = 0; i < commands.length; i++) {
                    var cmd = commands[i];
                    //console.log(cmd);
                    if (cmd[0].toLowerCase().search(actual.toLowerCase()) >= 0) {

                        var opt = options.child('div').html(cmd[0]);

                        opt.get(0).setAttribute('data-onclick', cmd[1]);
                        opt.get(0).onclick = function (event) {
                            event.stopPropagation();
                            event.preventDefault();
                            //console.log("e")
                            callback(this.getAttribute("data-onclick"), e);
                            e.remove();
                            return false;
                        };
                    } else {
                        //console.log(cmd[0].search(actual), actual, cmd[0])
                    }
                }
            }
        }

        e.get(0).addEventListener('blur', function (event) {
            //console.log(event)
            if (event.relatedTarget != null) {
                try {
                    $(this).remove();
                } catch (error) {
                    //console.log(error);
                }
            }

        }, true)

    }

    return this;
}
/* -------------------------------------------------------- */
/**
 * Special functions
 */
function encode_utf8(s) {
    return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
    return decodeURIComponent(escape(s));
}

String.prototype.insertAt = function (index, string) {
    return this.substr(0, index) + string + this.substr(index);
}

/**
 * Inserts text at the position of the cursor
 * @param {String} text 
 */
function insertTextAtCursor(text) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

/**
 * Gets the cursor posiiton in the specified element
 * @param {String} input The element
 */
function getCaretPos(input) {
    // Internet Explorer Caret Position (TextArea)
    if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        var bookmark = range.getBookmark();
        var caret_pos = bookmark.charCodeAt(2) - 2;
    } else {
        // Firefox Caret Position (TextArea)
        if (input.setSelectionRange)
            var caret_pos = input.selectionStart;
    }
    return caret_pos;
}