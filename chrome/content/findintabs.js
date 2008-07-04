//Create elements
var findintabscheckbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "checkbox");
findintabscheckbox.id = 'findintabs-checkbox';
var findintabsresults = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "vbox");
findintabsresults.id = 'findintabs-results';

//other important elements
var FindToolbar = document.getElementById('FindToolbar');
var statusbar = document.getElementById('status-bar');
var hbox = document.getAnonymousNodes(FindToolbar)[0];
var oldNode = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "find-case-sensitive");
var bottombox = document.getElementById("browser-bottombox");

//insert elements in proper position
hbox.insertBefore(findintabscheckbox, oldNode);
bottombox.insertBefore(findintabsresults, statusbar);
  

//function to be called when checkbox is clicked
_findintabs_setstatus = function() {

  checked = findintabscheckbox.checked;
  
  document.getElementById('isFindInTabs').status = checked;
  
  findintabsresults.hidden = !checked;
  
};

findintabscheckbox.addEventListener('command', _findintabs_setstatus, true);