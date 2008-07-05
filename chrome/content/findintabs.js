
var _findintabs = {

  init: function() {
  /*
    //Create elements
    var checkbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "checkbox");
    checkbox.id = 'findintabs-checkbox';
    var resultspane = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "vbox");
    resultspane.id = 'findintabs-results';
    
    //var findbar = document.getElementById('FindToolbar');
    
    //findbar.appendChild(checkbox);
    //findbar.appendChild(resultspane);
    */
},
  
  
  onLoad: function() {
/*    var checkbox =   document.getElementById('findintabs-checkbox');
    var resultspane = document.getElementById('findintabs-results');
    
    //other important elements
    
    var checkbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "checkbox");
    checkbox.id = 'findintabs-checkbox';
    var resultspane = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "vbox");
    resultspane.id = 'findintabs-results';

    var FindToolbar = document.getElementById('FindToolbar');
    var statusbar = document.getElementById('status-bar');
    var hbox = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "findbar-container");
    var oldNode = document.getAnonymousElementByAttribute(FindToolbar, "anonid", "find-case-sensitive");
    var bottombox = document.getElementById("browser-bottombox");
    
    //insert elements in proper position
    hbox.insertBefore(checkbox, oldNode);
    bottombox.insertBefore(resultspane, FindToolbar);    
    
    checkbox.addEventListener('command', this.setstatus, false);
    
    // overrride closeing of the findbar to close the results bar too
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function() {
      document.getElementById('findintabs-results').hidden = true;
      return gFindBar.close_old(); 
    }
    
    // overrride opening of the findbar to open  the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function() {
      document.getElementById('findintabs-results').hidden = !(document.getElementById('isFindInTabs').status);
      return gFindBar.open_old();  
    }  
    
  },
  
  //function to be called when checkbox is clicked
  setstatus: function(){
    isChecked = document.getElementById('findintabs-checkbox').checked;
    document.getElementById('isFindInTabs').status = isChecked;
    document.getElementById('findintabs-results').hidden = !isChecked;
  },
  
  //fucntion to be called when a result in the list is clickedf
  selectresult: function(id) {
    alert("This box should probably do something when result #" + id + " is selected." );
    
  }


  */
}
}

_findintabs.init();  

window.addEventListener("load", function() {
  _findintabs.onLoad();  

}, false);


