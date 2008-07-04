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
bottombox.insertBefore(findintabsresults, FindToolbar);

findintabscheckbox.addEventListener('command', _findintabs_setstatus, false);


window.addEventListener("load", function() {
  
  // overrride closeing of the findbar to close the results bar too
  gFindBar.close_old = gFindBar.close;
  gFindBar.close = function() {
    findintabsresults.hidden = true;
    return gFindBar.close_old(); 
  }
  
  // overrride opening of the findbar to open  the results bar too if it's set
  gFindBar.open_old = gFindBar.open;
  gFindBar.open = function() {
    findintabsresults.hidden = !(document.getElementById('isFindInTabs').status);
    return gFindBar.open_old();  
  }
  
  
  

}, false);


//function to be called when checkbox is clicked
function _findintabs_setstatus (){
  checked = findintabscheckbox.checked;
  document.getElementById('isFindInTabs').status = checked;
  findintabsresults.hidden = !checked;
}

//fucntion to be called when a result in the list is clicked
function _findintabs_selectresult (id) {
  alert("This box should probably do something when result #" + id + " is selected." );
 
  
}

