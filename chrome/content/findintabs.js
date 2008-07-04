//Create elements
var findintabscheckbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "checkbox");
findintabscheckbox.id = 'findintabs-checkbox';
var findintabsresults = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "vbox");
findintabsresults.id = 'findintabs-results';

//other important elements
var FindToolbar = document.getElementById('FindToolbar');
var statusbar = document.getElementById('status-bar');

var hbox = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "findbar-container");
var oldNode = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "find-case-sensitive");
var bottombox = document.getElementById("browser-bottombox");
var closebutton = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "find-closebutton");

//not sure what we can do with these  yet, but they look relevant.
var cmd_find = document.getElementById('cmd_find');
var key_find = document.getElementById('key_find');

//insert elements in proper position
hbox.insertBefore(findintabscheckbox, oldNode);
bottombox.insertBefore(findintabsresults, statusbar);
 

//function to be called when checkbox is clicked
_findintabs_setstatus = function() {
  checked = findintabscheckbox.checked;
  document.getElementById('isFindInTabs').status = checked;
  findintabsresults.hidden = !checked;
};

//event called when findbar is modified, so we can open/close the results window properly
_findtoolbar_toggle = function (event) {
  if(event.attrName == 'hidden') {
    if (event.newValue == 'true') 
      findintabsresults.hidden = true;
    else 
      findintabsresults.hidden = !(document.getElementById('isFindInTabs').status); 
  }
}

_findintabs_selectresult = function (id) {
  alert("This box should probably do something when result #" + id + " is selected." );

}

findintabscheckbox.addEventListener('command', _findintabs_setstatus, true);
FindToolbar.addEventListener('DOMAttrModified', _findtoolbar_toggle, true);
