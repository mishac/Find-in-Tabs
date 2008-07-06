
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
    
    //overrride the find function!
    gFindBar._find_old = gFindBar._find;
    gFindBar._find = function(aValue) {
      alert('HAHA OVERLOAD!');
      return gFindBar._find_old(aValue);
    }
        
/*    
          var val = aValue || this._findField.value

          this._enableFindButtons(val);
          if (this.getElement("highlight").checked)
            this._setHighlightTimeout();

          this._updateCaseSensitivity(val);

          var fastFind = this.browser.fastFind;
          var res = fastFind.find(val, this._findMode == this.FIND_LINKS);
          this._updateFoundLink(res);
          this._updateStatusUI(res, false);

          if (this._findMode != this.FIND_NORMAL)
            this._setFindCloseTimeout();

          return res;
          
          

*/
    
    
    
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

