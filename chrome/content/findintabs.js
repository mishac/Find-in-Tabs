var findInTabs = {
  
  onLoad: function() {
    gFindBar.resultsList = new Array();
    gFindBar.searchItem = null;
    
    this.strings = document.getElementById('findintabs-strings');    
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
      findInTabs.toggleResultsList(findInTabs.isFindInTabs);
      return gFindBar.open_old();  
    }
    
    //overrride the find function!
    gFindBar._find_old = gFindBar._find;
    gFindBar._find = function(aValue) {
        //do it the new way
       if (findInTabs.isFindInTabs) {
        
        val = aValue || this._findField.value;
        
        if (val == this.searchItem)
          return;
          

        this.searchItem = val;
        
        if (this.getElement("highlight").checked){
          this._setHighlightTimeout();
          isHighlight = true;
        } else {
          isHighlight = false;
        }

        this._updateCaseSensitivity(val);


        if (this._findMode != this.FIND_NORMAL)
            this._setFindCloseTimeout();

          findInTabs.clearList();
          
          var numTabs = gBrowser.browsers.length;
          
          for (i = 0; i < numTabs; ++i) {
            var frames = findInTabs.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
            
            for (j = 0; j < frames.length; ++j) {
              //var sel = frames[j].getSelection(); // should be an empty selection
              var body = frames[j].document.body;
              var count = body.childNodes.length;
              var searchRange = findInTabs.newRange(body, 0, body, count);
              var startPt = findInTabs.newRange(body, 0, body, 0);
              var endPt = findInTabs.newRange(body, count, body, count);
              var retRange = null;
              var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"]
                                     .createInstance()
                                     .QueryInterface(Components.interfaces.nsIFind);
              finder.caseSensitive = this._shouldBeCaseSensitive(val);


              while ((retRange = finder.Find(val, searchRange, startPt, endPt))) {
              
                
               // sel.addRange(retRange);
                this.resultsList.push(new findInTabs.result(retRange, frames[j], i));
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
          
          if (len) {
            findInTabs.updateFindStatus(true);
          } else {
            this._findStatusIcon.setAttribute('status', 'notfound');
            this._findStatusDesc.textContent = this._notFoundStr;
            this._findField.setAttribute('status', 'notfound');
          }
          // populate the list, if our find yielded results
          if (len) {
            window.setTimeout(function() { findInTabs.populateList(); }, 0)
            
          }
          else {
            findInTabs.clearList();
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
    
    
    var numTabs = gBrowser.browsers.length;
    
    for (i = 0; i < numTabs; ++i) {
      var doc = gBrowser.getBrowserAtIndex(i).contentDocument.wrappedJSObject;
      this.removeHighlight(doc);
    }
  
  },
  toggleResultsList: function(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    document.getElementById('findintabs-results-box').hidden =  !this.isFindInTabs;
    document.getElementById('findintabs-splitter').hidden = !this.isFindInTabs;
  
    if (aFindInTabs && gFindBar._findField.value) {
      
      gFindBar._find();
    }
  },
  
  selectResult: function() {
    var t = document.getElementById('findintabs-results-list');
    var tabNum = gFindBar.resultsList[t.currentIndex].ownerTab;
    var range =  gFindBar.resultsList[t.currentIndex].range;
    var win =  gFindBar.resultsList[t.currentIndex].ownerWindow.wrappedJSObject;
    
    gBrowser.mTabContainer.selectedIndex = tabNum;
    
    
    //create a new HTML span node surrounding the range, then use its 'scrollintoview' function to move the page down.
    var newNode = document.createElementNS("http://www.w3.org/1999/xhtml","html:span");

    range.surroundContents(newNode);

    newNode.scrollIntoView(true);

  }, 
  
  getFrames: function(aWinList, aFrame) {
    const frameList = aFrame.frames;
    if (aWinList != null)
      aWinList.push(aFrame);
    // in addition to finding the windows in this tab, we will clear any selections

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
    
    treechildren = document.getElementById('findintabs-results-list-children');
    
    for (i = 0; i < gFindBar.resultsList.length; ++i) {
    
      findInTabs.highlight(gFindBar.resultsList[i].range);
      
      newItem = document.createElement("treeitem");
      newRow = document.createElement("treerow");
      treechildren.appendChild(newItem);
      newItem.appendChild(newRow);
            
      cell1 =  document.createElement("treecell");
      cell1.setAttribute("label", gFindBar.resultsList[i].ownerTab + 1);
            
      cell2 =  document.createElement("treecell");
      tabTitle = gBrowser.getBrowserAtIndex(gFindBar.resultsList[i].ownerTab).contentDocument.wrappedJSObject.title;
      cell2.setAttribute("label",tabTitle);
      
      
      cell3 =  document.createElement("treecell");
      
      
      rangeText = gFindBar.resultsList[i].range.commonAncestorContainer.wrappedJSObject.nodeValue;

      cell3.setAttribute("label", rangeText.toString());
      
      newRow.appendChild(cell1);
      newRow.appendChild(cell2);
      newRow.appendChild(cell3);
      
      
      
    }
  
  },
  
  highlight: function(aRange) {
    
    var baseNode = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    
     //TODO: get the colors from the mozlla cs
    baseNode.style.backgroundColor = 'yellow';
    baseNode.style.color = 'black';
    baseNode.style.display = "inline";
    baseNode.style.fontSize = "inherit";
    baseNode.style.padding = "0";
    baseNode.className = "__mozilla-findbar-search";


    var startContainer = aRange.startContainer;
    var startOffset = aRange.startOffset;
    var endOffset = aRange.endOffset;
    var docfrag = aRange.extractContents();
    var before = startContainer.splitText(startOffset);
    var parent = before.parentNode;
    baseNode.appendChild(docfrag);
    parent.insertBefore(baseNode, before);
    return baseNode;

  },
  
  removeHighlight: function(doc) {
  
    
    results = doc.getElementsByClassName("__mozilla-findbar-search");
    
    for (i=0; i < results.length; i++) {
        
      var elem = results.item(i);
      
      
      var child = null;
      var docfrag = document.createDocumentFragment();
      var  newChild = document.createTextNode(" Some text added dynamically. ");

     docfrag.appendChild(newChild);

      var next = elem.nextSibling;
      var parent = elem.parentNode;
/*      
      elem.normalize();
      /*
      while ((child = elem.firstChild)) {

        docfrag.appendChild(child);
      
      }
      var children = elem.childNodes;
      
      for (j = 0; j < children.length; j++) {
//        child = children.item(i);
  //      newChild = document.createTextNode(" Some text added dynamically. ");

    //    docfrag.appendChild(newChild);
    
    
        
      

      
      } 
*/

      parent.removeChild(elem);
      parent.insertBefore(docfrag, next);
      parent.normalize();
  
  
      //elem.parent.removeChild(elem);    
    
    }
  }
  
  
}

window.addEventListener("load", findInTabs.onLoad, false);