var findInTabs = {

  onLoad: function _onLoad() {
    this.MAX_RESULTS = 200;
    this.HIGHLIGHT_CLASS = "__mozilla-findbar-search";
    this.IGNORE_NODES = ['i', 'b', 'em', 'strong', 'a']
    
    this.searchItem = null;
    this.searchResults = [];
    
    //useful elements   
    this.strings = document.getElementById('findintabs-strings');
    this.resultsBox =  document.getElementById('findintabs-results-box');
    this.resultsList = document.getElementById('findintabs-results-list');
    
    //register the style sheet
    var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                    .getService(Components.interfaces.nsIStyleSheetService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI("chrome://findintabs/skin/findintabs-page.css", null, null);
    if(!sss.sheetRegistered(uri, sss.USER_SHEET))
      sss.loadAndRegisterSheet(uri, sss.USER_SHEET);

    this.isFindInTabs = false
    this.initialized = true;
  },
  
  clearList: function _clearList() {
    // remove list children and zero out the results array, etc.
    while (this.resultsList.hasChildNodes()) {
      this.resultsList.removeChild(this.resultsList.lastChild);
    }
    this.searchResults.length = 0;
    
    var numTabs = gBrowser.browsers.length;
    
    for (var i = 0;i < numTabs; i++) {
      var doc = gBrowser.getBrowserAtIndex(i).contentDocument;
      this.removeHighlight(doc);
    }
  },

  toggleResultsList: function _toggleResultsList(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    this.resultsBox.hidden =  !this.isFindInTabs;
    
    if (aFindInTabs) {
      gFindBar.getElement("highlight").disabled = true;
      if(gFindBar._findField.value)
        gFindBar._find();
      
    } else {
      this.clearList();
     
      if(gFindBar._findField.value) {
        gFindBar.getElement("highlight").disabled = false;
        gFindBar.getElement("find-previous").disabled = false;
        gFindBar.getElement("find-next").disabled = false;
      }
    }
  },
  
  selectItem: function _selectItem() {
    var list = this.resultsList;
    if (!this.searchResults[list.currentIndex])
      return;
    
    var tabNum = this.searchResults[list.currentIndex].ownerTab;
    var range =  this.searchResults[list.currentIndex].range;
    
    gBrowser.mTabContainer.selectedIndex = tabNum;
    
    var node = range.commonAncestorContainer.parentNode;
    node.scrollIntoView(true);
    
    list.focus();
  }, 
  
  getFrames: function _getFrames(aWinList, aFrame) {
    const frameList = aFrame.frames;

    if (aWinList != null)
      aWinList.push(aFrame);
      
    var len = frameList.length;
    var item = null;
    for (var i = 0; item = frameList[i]; i++) {
      this.getFrames(aWinList, item);
    }
    
    return aWinList;
  },
  
  newRange: function _newRange(aStartElem, aStartOffset, aEndElem, aEndOffset) {
    var range = document.createRange();
    range.setStart(aStartElem, aStartOffset);
    range.setEnd(aEndElem, aEndOffset);
    return range;
  },
  
  result: function _result(aRange, aTab) {
    this.range = aRange;
    this.ownerTab = aTab;
  },
  
  updateFindStatus: function _updateFindStatus(aStatusFlag) {
    // aStatusFlag (boolean)  True means show number of find results in the findbar status, false means clear it
    var statusIcon = gFindBar._findStatusIcon;
    var statusText = gFindBar._findStatusDesc;
    var findField = gFindBar._findField;
    var findPrev = gFindBar.getElement("find-previous");
    var findNext = gFindBar.getElement("find-next");
    
    var len = this.searchResults.length;
    
    if (aStatusFlag) {
      statusIcon.setAttribute('status', 'findintabs-results');
      
      if (len == 1) {
        statusText.textContent = this.strings.getFormattedString('findOneResultStatusMessage', [len]);
      }
      else if (len > this.MAX_RESULTS) {
         statusText.textContent = this.strings.getFormattedString('findResultsTooMany', [this.MAX_RESULTS]);
      }
      else {
        statusText.textContent = this.strings.getFormattedString('findResultStatusMessage', [len]);  
      }
      
      findField.removeAttribute('status');
      findPrev.disabled = false;
      findNext.disabled = false;
    }
    else if (statusIcon.getAttribute('status') == 'findintabs-results') {
      statusText.textContent = '';
      statusIcon.removeAttribute('status');
      findField.setAttribute("status", "notfound");    
      findPrev.disabled = true;
      findNext.disabled = true;
    }
  },
  
  populateList: function _populateList () { 
    findField = gFindBar._findField;
    list = document.getElementById('findintabs-results-list');
    
    for (var i = 0; item = this.searchResults[i]; i++) {
      var listItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", 
        "richlistitem");
      
      listItem.setAttribute("class", 'findintabs-results-list-item');
      listItem.setAttribute("context", 'findintabs-context-menu');
      //listItem.addEventListener("click", this.clickItem, false);

      
      var tabNum = item.ownerTab + 1;
      var tabTitle = gBrowser.getBrowserAtIndex(item.ownerTab).contentDocument.title;
      
      //getting range text and some text before and after
      var range = item.range;
      var rangeText = range.toString();
      var startContainer = range.startContainer;
      var endContainer = range.endContainer;
      
      var beforeText = startContainer.textContent.substring(0, range.startOffset);
      if (beforeText.length > 80)
        beforeText = beforeText.substr(beforeText.length - 80, 80);
      
      var afterText = endContainer.textContent.substring(range.endOffset);
      if (afterText.length > 80)
        afterText = afterText.substr(0, 80);

      var hbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "hbox");

      var cell1 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      cell1.setAttribute("class", 'findintabs-results-list-tabnumber');
      cell1.setAttribute("value", 'Tab #' + tabNum);
      
      var cell2 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      cell2.setAttribute("class", 'findintabs-results-list-tabtitle');
      cell2.setAttribute("value", tabTitle);
      cell2.setAttribute("crop", 'end');
      
      var cell3 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "description");
      cell3.setAttribute("crop", 'end');
      cell3.setAttribute("class", 'findintabs-results-list-text');
      
      var rangeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var beforeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var afterSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");

      rangeSpan.style.backgroundColor = 'yellow';

      var rangeSpanText = document.createTextNode(rangeText);
      var beforeSpanText = document.createTextNode(beforeText);
      var afterSpanText = document.createTextNode(afterText); 
      
      beforeSpan.appendChild(beforeSpanText);
      rangeSpan.appendChild(rangeSpanText);
      afterSpan.appendChild(afterSpanText);

      cell3.appendChild(beforeSpan); 
      cell3.appendChild(rangeSpan); 
      cell3.appendChild(afterSpan); 
      
      hbox.appendChild(cell1);
      hbox.appendChild(cell2);
      hbox.appendChild(cell3);
      
      listItem.appendChild(hbox);
      list.appendChild(listItem);  
      
      this.highlight(this.searchResults[i].range);
    }
  },
  
  highlight: function _highlight(aRange) {
    var baseNode = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    baseNode.className = this.HIGHLIGHT_CLASS;

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
  
  removeHighlight: function _removeHighlight(aDocument) {
    this.removeNodes(aDocument, this.HIGHLIGHT_CLASS);
  },

  removeNodes: function _removeNodes(aDocument, aClassName) {
    var nodeList = aDocument.getElementsByClassName(aClassName);
    var len = nodeList.length;
    var elem;
    
    for (var i = 0; i < len, elem = nodeList.item(len - i - 1); i++) {

      var parent = elem.parentNode;      

      while ((child = elem.firstChild)) {
       parent.insertBefore(child, elem);
      }

      parent.removeChild(elem);
      parent.normalize();
    }
  },
  
  copyText: function _copyText() {
      var range = this.searchResults[this.resultsList.currentIndex];
      
      var text = this.resultsList.getSelectedItem(0).textContent;
      
      alert(text);
      
  }
}

// overload functions of the findbar to take advantage of fintintabs
var findBarOverLoad = {
  onLoad: function _onLoad() {

    // override closeing of the findbar to close the results bar too.
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function _newClose() {
      findInTabs.clearList();
      findInTabs.resultsBox.hidden = true;
      return gFindBar.close_old(); 
    }
    
    // override opening of the findbar to open the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function _newOpen() {
      findInTabs.toggleResultsList(findInTabs.isFindInTabs);
      return gFindBar.open_old();  
    }
    
    //overload the next/prev buttons functions
    gFindBar.onFindAgainCommand_old = gFindBar.onFindAgainCommand;
    gFindBar.onFindAgainCommand = function _newOnFindAgainCommand(aFindPrevious) {
      if (findInTabs.isFindInTabs) {
        var list = findInTabs.resultsList;
        list.focus();
        
        if (aFindPrevious)
          list.goUp();
        else 
          list.goDown();
          
        list.ensureSelectedElementIsVisible();
      }
      else
        return gFindBar.onFindAgainCommand_old(aFindPrevious);
    }
    
    //overrride the find function!
    gFindBar._find_old = gFindBar._find;
    gFindBar._find = function new_Find(aValue) {
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
          
          for (var j = 0; thisFrame = frames[j]; j++) {
            
            var body = thisFrame.document.body;
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

            while ((retRange = finder.Find(val, searchRange, startPt, endPt)) 
              && (findInTabs.searchResults.length <= findInTabs.MAX_RESULTS)) {
              
              findInTabs.searchResults.push(new findInTabs.result(retRange, i));
              
              startPt.detach();        
              startPt = document.createRange();
              startPt.setStart(retRange.endContainer, retRange.endOffset);
              startPt.collapse(true);
            }

            //cleanup
            startPt.detach();
            searchRange.detach();
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