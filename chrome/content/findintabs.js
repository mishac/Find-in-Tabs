
var findintabs = {
  
  onLoad: function() {
    this.results = new Array();
    this.isFindInTabs = false;
    
    // overrride closeing of the findbar to close the results bar too
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function() {
      document.getElementById('findintabs-splitter').hidden = true;
      document.getElementById('findintabs-results-box').hidden = true;
      return gFindBar.close_old(); 
    }
    
    // overrride opening of the findbar to open  the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function() {
      findintabs.toggleResultsList(findintabs.isFindInTabs);
      return gFindBar.open_old();  
    }
    
    
    
    this.initialized = true;
     
    
  },
  
  toggleResultsList: function(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    document.getElementById('findintabs-results-box').hidden =  !this.isFindInTabs;
    document.getElementById('findintabs-splitter').hidden = !this.isFindInTabs;
  
  },
  
  selectResult: function(id) {
    
    gBrowser.mTabContainer.selectedIndex = id;
  
  }
  
  
}

window.addEventListener("load", findintabs.onLoad, false);


