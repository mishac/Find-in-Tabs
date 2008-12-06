var checkCompat = {
  init: function() {
    var extensionsListBox = document.getElementById('extensionsList');
    var conflicts = window.arguments[0];
    var conflict = null;
    
    while (conflict = conflicts.pop()) {
      var listItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", 
      "listitem");
      listItem.setAttribute("label", conflict);
      extensionsListBox.appendChild(listItem);
    }     
  },
  close: function() {
  
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
    
    var disableCheck = document.getElementById('disableCheck');
    var checkCompat = !disableCheck.checked;
    
    prefs.setBoolPref("extensions.findintabs.checkcompatability", checkCompat);
    
    window.close();
  }
}


window.addEventListener("load", function() {
  checkCompat.init();
}, false);

      
