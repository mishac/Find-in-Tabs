var findInTabs = {

  onLoad: function() {
    this.searchItem = null;
    this.searchResults = null;
    this.searchResults = [];
    this.strings = document.getElementById('findintabs-strings');
    this.resultsBox =  document.getElementById('findintabs-results-box');
    this.resultsList = document.getElementById('findintabs-results-list');
    this.isFindInTabs = false
    this.initialized = true;
  },
  clearList: function() {
    // remove list children and zero out the results array, etc.
    while (this.resultsList.hasChildNodes()) {
      this.resultsList.removeChild(this.resultsList.lastChild);
    }
    
    this.searchResults.length = 0;
    
    var numTabs = gBrowser.browsers.length;
    
    for (var q = 0;q < numTabs; q++) {
      
      var doc = gBrowser.getBrowserAtIndex(q).contentDocument;
      
      this.removeHighlight(doc);
    }

  
  },
  toggleResultsList: function(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    
    this.resultsBox.hidden =  !this.isFindInTabs;
    
    if (aFindInTabs) {
      gFindBar.getElement("highlight").disabled = true;

      if(gFindBar._findField.value) {
        gFindBar._find();
      }
      
    } else {
      this.clearList();
     
      if(gFindBar._findField.value) {
        
        gFindBar.getElement("highlight").disabled = false;
        gFindBar.getElement("find-previous").disabled = false;
        gFindBar.getElement("find-next").disabled = false;
        
      }
    }
  },
  
  selectResult: function() {
    
    var list = this.resultsList;
    
    if (!this.searchResults[list.currentIndex]) {
      return;
    }
    
    var tabNum = this.searchResults[list.currentIndex].ownerTab;
    var range =  this.searchResults[list.currentIndex].range;
    
    gBrowser.mTabContainer.selectedIndex = tabNum;

    var node = range.startContainer.parentNode; 
    
    node.scrollIntoView(true);
  /*  
    var baseNode = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    baseNode.style.border = 'red 2px solid';
    baseNode.style.padding = "2px";
    baseNode.className = "__mozilla-findintabs-selected";

    range.surroundContents(node);    
   //this.removeScrollIntoView(node);
    */
    list.focus();
  }, 
  
  getFrames: function(aWinList, aFrame) {
    const frameList = aFrame.frames;
    if (aWinList != null)
      aWinList.push(aFrame);
      
    var len = frameList.length;
     
    for (var k = 0; k < frameList.length; k++) {
      this.getFrames(aWinList, frameList[k]);
    }

    return aWinList;
  },
  newRange: function(aStartElem, aStartOffset, aEndElem, aEndOffset) {
    var range = document.createRange();
    range.setStart(aStartElem, aStartOffset);
    range.setEnd(aEndElem, aEndOffset);
    return range;
  },
  
  result: function(aRange, aTab) {
    this.range = aRange;
    this.ownerTab = aTab;
  },
  
  updateFindStatus: function(aStatusFlag) {
    // aStatusFlag (boolean)  True means show number of find results in the findbar status, false means clear it
    //findBar = document.getElementById('FindToolbar');
    var statusIcon = gFindBar._findStatusIcon;
    var statusText = gFindBar._findStatusDesc;
    var findField = gFindBar._findField;
    var len = this.searchResults.length;
    
    if (aStatusFlag) {
      statusIcon.setAttribute('status', 'findintabs-results');
      statusText.textContent = (len != 1) ? this.strings.getFormattedString('findResultStatusMessage', [len])
                                    : this.strings.getFormattedString('findOneResultStatusMessage', [len]);
      findField.removeAttribute('status');
      
      gFindBar.getElement("find-previous").disabled = false;
      gFindBar.getElement("find-next").disabled = false;

    }
    else if (statusIcon.getAttribute('status') == 'findintabs-results') {
      statusText.textContent = '';
      statusIcon.removeAttribute('status');
      findField.setAttribute("status", "notfound");    
      
      gFindBar.getElement("find-previous").disabled = true;
      gFindBar.getElement("find-next").disabled = true;
      
      
    }
  },
  populateList: function() { 
    
    findField = gFindBar._findField;
    
    list = document.getElementById('findintabs-results-list');
    
    len = this.searchResults.length
    for (var i = 0; i < len; i++) {

      var listItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "richlistitem");
      var tabNum = this.searchResults[i].ownerTab + 1;
      var tabTitle = gBrowser.getBrowserAtIndex(this.searchResults[i].ownerTab).contentDocument.title;
      
      //getting range text and some text before and after
      var range =this.searchResults[i].range;
      
      var rangeText = range.toString();
            
      var beforeText = range.startContainer.textContent.substring(0, range.startOffset);
      var afterText = range.endContainer.textContent.substring(range.endOffset);
      
      var hbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "hbox");
      
      var cell1 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      var cell2 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      var cell3 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "description");
      
      cell1.setAttribute("value", 'Tab #' + tabNum);
      cell1.setAttribute("width", '40px');
      
      cell2.setAttribute("value", tabTitle);
      cell2.setAttribute("width", '150px');
      cell2.setAttribute("crop", 'end');
      
      cell3.setAttribute("crop", 'end');
      
      var rangeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var beforeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var afterSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      
      rangeSpan.style.backgroundColor = 'yellow';
      
      var rangeSpanText = document.createTextNode(rangeText);
      var beforeSpanText = document.createTextNode(beforeText);
      var afterSpanText = document.createTextNode(afterText); 
      
      beforeSpan.appendChild(beforeSpanText);
      cell3.appendChild(beforeSpan); 
            
      rangeSpan.appendChild(rangeSpanText);
      cell3.appendChild(rangeSpan); 
            
      afterSpan.appendChild(afterSpanText);
      cell3.appendChild(afterSpan); 
      
      
      hbox.appendChild(cell1);
      hbox.appendChild(cell2);
      hbox.appendChild(cell3);
      
      listItem.appendChild(hbox);
      list.appendChild(listItem);  
      
      this.highlight(this.searchResults[i].range);
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
  
  removeHighlight: function(aDocument) {
    var results = aDocument.getElementsByClassName("__mozilla-findbar-search");
    this.removeNodes(results);
  },
  removeScrollIntoView: function(doc) {
    var results = doc.getElementsByClassName("__mozilla-findintabs-selected");
    this.removeNodes(results);
  },
  
  removeNodes: function(aNodeList) {
  
    var len = aNodeList.length;
    for (var i = 0; i < len; i++) {
      var elem = aNodeList.item(len - i - 1);
      var parent = elem.parentNode;      
      while ((child = elem.firstChild)) {

        parent.insertBefore(child, elem);

      }

      parent.removeChild(elem);

      parent.normalize();
    }
  
  }
}


var findBarOverLoad = {
  onLoad: function() {
  
    // overload functions of the findbar to take advantage of fintintabs 

    
    // override closeing of the findbar to close the results bar too.
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function() {
      findInTabs.clearList();
      findInTabs.resultsBox.hidden = true;
      return gFindBar.close_old(); 
    }
    
    // override opening of the findbar to open the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function() {
      findInTabs.toggleResultsList(findInTabs.isFindInTabs);
      return gFindBar.open_old();  
    }
    
    //overload the next/prev buttons functions
    gFindBar.onFindAgainCommand_old = gFindBar.onFindAgainCommand;
    gFindBar.onFindAgainCommand = function(aFindPrevious) {
      if (findInTabs.isFindInTabs) {
        
        var list = findInTabs.resultsList;
        
        list.focus();
        
        if (aFindPrevious)
          list.goUp();
        else 
          list.goDown();
          
        list.ensureSelectedElementIsVisible();
      }
      else { return gFindBar.onFindAgainCommand_old(aFindPrevious); }
    
    }
    
    //overrride the find function!
    gFindBar._find_old = gFindBar._find;
    gFindBar._find = function(aValue) {
        //if findInTabs is on, do it the new way
      if (findInTabs.isFindInTabs) {
        
        val = aValue || this._findField.value;
        
    /*    if (val == this.searchItem)
              return;
          */

        findInTabs.searchItem = val;

        this._updateCaseSensitivity(val);


        if (this._findMode != this.FIND_NORMAL)
          this._setFindCloseTimeout();

        findInTabs.clearList();
        
        var numTabs = gBrowser.browsers.length;
        
        for (var i = 0; i < numTabs; i++) {
          var frames = findInTabs.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
          
          for (var j = 0; j < frames.length; j++) {
            var body = frames[j].document.body;
            
            //dont search pages that dont have a document body
            if (!body) 
              continue;
            
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
            
              findInTabs.searchResults.push(new findInTabs.result(retRange, i));
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

        if (findInTabs.searchResults.length) {
          findInTabs.populateList();
          findInTabs.updateFindStatus(true);
        } else {
          this._findStatusIcon.setAttribute('status', 'notfound');
          this._findStatusDesc.textContent = this._notFoundStr;
          this._findField.setAttribute('status', 'notfound');
          findInTabs.clearList();
        }

      } else {
        //otherwise do it the old way
        return gFindBar._find_old(aValue);
      }
    }
  
  }
}

  
    

window.addEventListener("load", function() {
                                  findInTabs.onLoad();
                                  findBarOverLoad.onLoad();
                                  }, false);