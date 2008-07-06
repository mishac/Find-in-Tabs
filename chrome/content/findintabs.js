var findintabs = {
  
  onLoad: function() {
    gFindBar.resultsList = new Array();
    this.strings = document.getElementById('findintabs-strings');    
    this.isFindInTabs = false;
    this.searchItem = null;
        
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
        //do it the new way
       if (findintabs.isFindInTabs) {
      
        this.searchItem = aValue || this._findField.value;
        

//          this._enableFindButtons(val);

        if (this.getElement("highlight").checked)
          this._setHighlightTimeout();

        this._updateCaseSensitivity(this.searchItem);


        if (this._findMode != this.FIND_NORMAL)
            this._setFindCloseTimeout();

          findintabs.clearList();
          
          var numTabs = gBrowser.browsers.length;
          
          for (i = 0; i < numTabs; ++i) {
            var frames = findintabs.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
            
            
            for (j = 0; j < frames.length; ++j) {
              var sel = frames[j].getSelection(); // should be an empty selection
              var body = frames[j].document.body;
              var count = body.childNodes.length;
              var searchRange = findintabs.newRange(body, 0, body, count);
              var startPt = findintabs.newRange(body, 0, body, 0);
              var endPt = findintabs.newRange(body, count, body, count);
              var retRange = null;
              var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"]
                                     .createInstance()
                                     .QueryInterface(Components.interfaces.nsIFind);
              finder.caseSensitive = this._shouldBeCaseSensitive(this.searchItem);
              while ((retRange = finder.Find(this.searchItem, searchRange, startPt, endPt))) {
                sel.addRange(retRange);
                this.resultsList.push(new findintabs.result(retRange, frames[j], i));
                startPt = document.createRange();
                startPt.setStart(retRange.endContainer, retRange.endOffset);
                startPt.collapse(true);
              }
              
              searchRange.detach();
              startPt.detach();
              endPt.detach();
        
            } 
          
          
          }
          // set findbar status
          var len = this.resultsList.length;
          
          if (len)
            findintabs.updateFindStatus(true);
          else {
            this._findStatusIcon.setAttribute('status', 'notfound');
            this._findStatusDesc.textContent = this._notFoundStr;
            this._findField.setAttribute('status', 'notfound');
          }
          // populate the list, if our find yielded results
          if (len) {
            window.setTimeout(function() { findintabs.populateList(); }, 0)
          }
          else {
            findintabs.clearList();
          }     

      } else {
        //otherwise do it the old way
        return gFindBar._find_old(aValue);
      }
    }
      
    
    this.initialized = true;
     
    
  },
  clearList: function() {
    // remove tree children and zero out the results array, etc.
    list = document.getElementById("findintabs-results-list-children");
    while (list.hasChildNodes()) {
      list.removeChild(list.lastChild);
    }
    gFindBar.resultsList.length = 0;
    this.searchItem = null;
  
  },
  
  toggleResultsList: function(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    document.getElementById('findintabs-results-box').hidden =  !this.isFindInTabs;
    document.getElementById('findintabs-splitter').hidden = !this.isFindInTabs;
  
  },
  
  selectResult: function(id) {
    
    gBrowser.mTabContainer.selectedIndex = id;
    
  }, 
  
  getFrames: function(aWinList, aFrame) {
    const frameList = aFrame.frames;
    if (aWinList != null)
      aWinList.push(aFrame);
    // in addition to finding the windows in this tab, we will clear any selections

    //aFrame.focus();
    //alert(aFrame);
    //var sel = document.commandDispatcher.focusedWindow.getSelection();
    
    //alert(aFrame.parentNode);
    var sel = aFrame.getSelection();
    if (sel != null) {
      sel.removeAllRanges();
    }
    for (var i = 0, j = frameList.length; i < j; i++) {
      this.getFrames(aWinList, frameList[i]);
    }
    return aWinList;
  },
  newRange: function(aStartElem, aStartOffset, aEndElem, aEndOffset) {
    var range = document.createRange();
    range.setStart(aStartElem, aStartOffset);
    range.setEnd(aEndElem, aEndOffset);
    return range;
  },
  result: function(aRange, aFrame, aTab) {
    this.range = aRange;
    this.ownerWindow = aFrame;
    this.ownerTab = aTab;
  },
  updateFindStatus: function(aStatusFlag) {
    // aStatusFlag (boolean)  True means show number of find results in the findbar status, false means clear it
    findBar = document.getElementById('FindToolbar');
    var statusIcon = findBar._findStatusIcon;
    var statusText = findBar._findStatusDesc;
    var len = gFindBar.resultsList.length;
    if (aStatusFlag) {
      statusIcon.setAttribute('status', 'findintabs-results');
      statusText.textContent = (len != 1) ? strings.getFormattedString('findResultStatusMessage', [len])
                                    : strings.getFormattedString('findOneResultStatusMessage', [len]);
    }
    else if (statusIcon.getAttribute('status') == 'findintabs-results') {
      statusText.textContent = '';
      statusIcon.removeAttribute('status');    
    }
  },
  populateList: function() { 
    
    findField = gFindBar._findField;     
    findField.addEventListener('keypress', this.findFieldChanged, false);
    
    treechildren = document.getElementById('findintabs-results-list-children');
    
    for (i = 0; i < gFindBar.resultsList.length; ++i) {
      newItem = document.createElement("treeitem");
      newRow = document.createElement("treerow");
      treechildren.appendChild(newItem);
      newItem.appendChild(newRow);
      
      
      cell1 =  document.createElement("treecell");
      cell1.label = gFindBar.resultsList[i].ownerTab;
      
      cell2 =  document.createElement("treecell");
      cell2.label = gFindBar.resultsList[i].ownerWindow;
      
      cell3 =  document.createElement("treecell");
      cell3.label = gFindBar.resultsList[i].range;
      
      newRow.appendChild(cell1);
      newRow.appendChild(cell2);
      newRow.appendChild(cell3);
      
    }
  
  },
  
  findFieldChanged: function(e) {
    // if the user wants to do a new find, start with a clean slate again
    if (e.target.value != findintabs.searchItem) {
      findintabs.clearList();
      //alert('rewr');
    }
  }
}

window.addEventListener("load", findintabs.onLoad, false);

