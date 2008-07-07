var findInTabs = {
  
  onLoad: function() {
    gFindBar.resultsList = new Array();
    gFindBar.searchItem = null;
    
    this.strings = document.getElementById('findintabs-strings');    
    this.isFindInTabs = false;
    
        
    // overrride closeing of the findbar to close the results bar too
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function() {
      findInTabs.clearList();
      document.getElementById('findintabs-results-box').hidden = true;
      return gFindBar.close_old(); 
    }
    
    // overrride opening of the findbar to open  the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function() {
      findInTabs.toggleResultsList(findInTabs.isFindInTabs);
      return gFindBar.open_old();  
    }
    
    //overload the next/prev buttons functions
    gFindBar.onFindAgainCommand_old = gFindBar.onFindAgainCommand;
    gFindBar.onFindAgainCommand = function(aFindPrevious) {
      if (findInTabs.isFindInTabs) {
        
        var list = document.getElementById('findintabs-results-list');
        
        list.focus();
        
        if (aFindPrevious)
          list.goUp();
        else 
          list.goDown();
          
        list.ensureSelectedElementIsVisible()
      }
      else { return gFindBar.onFindAgainCommand_old(aFindPrevious); }
    
    }
    
    //overrride the find function!
    gFindBar._find_old = gFindBar._find;
    gFindBar._find = function(aValue) {
        //do it the new way
       if (findInTabs.isFindInTabs) {
        
        val = aValue || this._findField.value;
        
    //    if (val == this.searchItem)
      //    return;
          

        this.searchItem = val;

        this._updateCaseSensitivity(val);


        if (this._findMode != this.FIND_NORMAL)
            this._setFindCloseTimeout();

          findInTabs.clearList();
          
          var numTabs = gBrowser.browsers.length;
          
          for (i = 0; i < numTabs; i++) {
            var frames = findInTabs.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
            
            for (j = 0; j < frames.length; ++j) {
              var body = frames[j].document.body;
              
              //dont search pages that dont have a document body
              if (!body) continue;
              
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
                this.resultsList.push(new findInTabs.result(retRange, i));
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
      
    
    this.initialized = true;
     
    
  },
  clearList: function() {
    // remove list children and zero out the results array, etc.
    list = document.getElementById("findintabs-results-list");
    while (list.hasChildNodes()) {
      list.removeChild(list.lastChild);
    }
    
    gFindBar.resultsList.length = 0;
    
    var numTabs = gBrowser.browsers.length;
    
    for (q = 0;q < numTabs; q++) {
      
      var doc = gBrowser.getBrowserAtIndex(q).contentDocument;
      
      this.removeHighlight(doc);
    }
  
  },
  toggleResultsList: function(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    
    document.getElementById('findintabs-results-box').hidden =  !this.isFindInTabs;
    
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
    var t = document.getElementById('findintabs-results-list');
    if (!gFindBar.resultsList[t.currentIndex]) {
      return;
    }
    
    var tabNum = gFindBar.resultsList[t.currentIndex].ownerTab;
    var range =  gFindBar.resultsList[t.currentIndex].range;
    
    gBrowser.mTabContainer.selectedIndex = tabNum;

    node = range.startContainer.parentNode; 
    
    node.scrollIntoView(true);
  /*  
    var baseNode = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    baseNode.style.border = 'red 2px solid';
    baseNode.style.padding = "2px";
    baseNode.className = "__mozilla-findintabs-selected";

    range.surroundContents(node);    
   //this.removeScrollIntoView(node);
    */
    t.focus();
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
  result: function(aRange, aTab) {
    this.range = aRange;
    this.ownerTab = aTab;
  },
  updateFindStatus: function(aStatusFlag) {
    // aStatusFlag (boolean)  True means show number of find results in the findbar status, false means clear it
    findBar = document.getElementById('FindToolbar');
    var statusIcon = findBar._findStatusIcon;
    var statusText = findBar._findStatusDesc;
    var findField = findBar._findField;
    var len = gFindBar.resultsList.length;
    
    if (aStatusFlag) {
      statusIcon.setAttribute('status', 'findintabs-results');
      statusText.textContent = (len != 1) ? strings.getFormattedString('findResultStatusMessage', [len])
                                    : strings.getFormattedString('findOneResultStatusMessage', [len]);
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
    
    listbox = document.getElementById('findintabs-results-list');
    
    for (i = 0; i < gFindBar.resultsList.length; i++) {
      
      var listItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "richlistitem");
      var tabNum = gFindBar.resultsList[i].ownerTab + 1;
      var tabTitle = gBrowser.getBrowserAtIndex(gFindBar.resultsList[i].ownerTab).contentDocument.title;
      
      //getting range text and some text before and after
      var range = gFindBar.resultsList[i].range;
      
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
      listbox.appendChild(listItem);  
      
      findInTabs.highlight(gFindBar.resultsList[i].range);
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
  
    
    results = aDocument.getElementsByClassName("__mozilla-findbar-search");

    this.removeNodes(results);
    
    //aDocument.body.innerHTML.replace(/<span style="padding: 0pt; background-color: yellow; color: black; display: inline; font-size: inherit;" class="__mozilla-findbar-search">"(.+)<\/span>/, "$1");
  },
  removeScrollIntoView: function(doc) {
  
    
    results = doc.getElementsByClassName("__mozilla-findintabs-selected");
    this.removeNodes(results);
  },
  
  removeNodes: function(aNodeList) {
  
    len = aNodeList.length;
    
    for (i = 0; i < len; i++) {
       
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

window.addEventListener("load", findInTabs.onLoad, false);