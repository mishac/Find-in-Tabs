/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is FindInTabs.
 *
 * The Initial Developer of the Original Code is
 * Misha Chitharanjan and Michael Havas
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Misha Chitharanjan and Michael Havas
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
var findInTabs = {

  onLoad: function _onLoad() {
    //load jQuery
    this.$ = (function(wnd) {
      var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                      .getService(Components.interfaces.mozIJSSubScriptLoader)
      loader.loadSubScript("chrome://findintabs/content/jquery-1.5.js",wnd);
      var jQuery = wnd.jQuery.noConflict(true);
      return jQuery;
    })(window);
    
    //load prefs
    this.app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    this.enableSound = this.app.prefs.getValue("accessibility.typeaheadfind.enablesound", '');
    this.soundURL = this.app.prefs.getValue("accessibility.typeaheadfind.soundURL", '');
    this.checkCompat = this.app.prefs.getValue("extensions.findintabs.checkcompatability", true);
    this.maxResults = this.app.prefs.getValue("extensions.findintabs.maxresults", 200);
    this.findDelay = this.app.prefs.getValue("extensions.findintabs.finddelay", 100);
    this.showFavicon = this.app.prefs.getValue("extensions.findintabs.showfavicon", true);

    this.findTimeout = 0;

    if (this.checkCompat) {
      this.compatabilityCheck();
    }
    
    // Add preference change observers
    this.app.prefs.get("extensions.findintabs.showfavicon").events.addListener('change', function(event) {
      this.showFavicon = this.app.prefs.getValue("extensions.findintabs.showfavicon", true);
      this.showFaviconColumn(this.showFavicon);
    });
    this.app.prefs.get("extensions.findintabs.maxresults").events.addListener('change', function(event) {
      this.maxResults = this.app.prefs.getValue("extensions.findintabs.maxresults", 200);
    });
    this.app.prefs.get("extensions.findintabs.maxresults").events.addListener('change', function(event) {
      this.findDelay = this.app.prefs.getValue("extensions.findintabs.finddelay", 100);
    });

    this.HIGHLIGHT_CLASS = "__mozilla-findbar-search";

    this.searchItem = null;
    this.searchResults = [];

    //useful elements
    this.strings = document.getElementById("findintabs-strings");
    this.checkbox = this.$("#findbar-findintabs-check", document);
    this.resultsBox =  this.$("#findintabs-results-box", document);
    this.resultsBox.bind("keypress", this.onKeyPress);
    
    this.resultsList = this.$("#findintabs-results-list", document);
    this.statusLabel = this.$("#match-findintabs-status", gFindBar);
    this.splitter = this.$("#findintabs-splitter", document);
    this.labelTree = this.$("#findintabs-label-tree", document);
    this.labelTreeCols = this.$("#findintabs-label-treecols", document);

    this.tabNumberLabel =  this.$("#findintabs-label-tabnumber", document);
    this.tabTitleLabel =  this.$("#findintabs-label-tabtitle", document);
    this.tabTextLabel =  this.$("#findintabs-label-tabtext", document);

    this.showFaviconColumn(this.showFavicon);

    this.wasHighlighted = false;

    //register the style sheet
    var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                    .getService(Components.interfaces.nsIStyleSheetService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI("chrome://findintabs/skin/findintabs-page.css", null, null);
    if(!sss.sheetRegistered(uri, sss.USER_SHEET))
      sss.loadAndRegisterSheet(uri, sss.USER_SHEET);

    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      if (sheets.item(i).href == "chrome://findintabs/skin/findintabs.css") {
        var cssRules = document.styleSheets.item(i).cssRules;
        break;
      }
    }

    for (i = 0; i < cssRules.length; i++) {
      cssRule = cssRules.item(i);
      if (cssRule.type == cssRule.STYLE_RULE) {
       switch(cssRule.selectorText) {
         case "#findintabs-results-list .findintabs-results-list-tabnumber":
           this.tabnumberStyle = cssRule;
           break;
         case "#findintabs-results-list .findintabs-results-list-tabtitle":
           this.tabtitleStyle = cssRule;
           break;
         default:
           break;
        }
      }
    }

    this.isFindInTabs = false;
    this.initialized = true;
  },

  showFaviconColumn: function _showFaviconColumn(aBool) {
    if (aBool) {
      this.faviconLabel = this.$("<treecol />");
      this.faviconLabel.attr("id", "findintabs-label-icon");
      this.faviconLabel.attr("fixed", "true");
      this.labelTreeCols.prepend(this.faviconLabel);
      if (this.isFindInTabs) {
       this.resultsList.children("richlistitem").each(function(i, el) {
          var item = this.searchResults[i],
                     faviconCell = $('<image />');
          //document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "image");
          var faviconURI = this.getFaviconURI(item.ownerTab);
      	  faviconCell.addClass("findintabs-favicon");
      	  faviconCell.attr("src", faviconURI);
      	  faviconCell.attr("tooltiptext", hbox.firstChild.getAttribute("tooltiptext"));
          $(el).children(":first").prepend(faviconCell);
        });
      }
    } else {
      if (this.faviconLabel) {
        this.labelTreeCols.empty();
        this.$(".findintabs-favicon", this.resultsList).remove();
      }

    }
  },
  compatabilityCheck: function _compatabilityCheck() {
    var incompatibleExtensions = {
      "findall@codedawn.com": "Find All",
      "{be351c24-bc28-40fb-849b-beea2a6fd252}": "Search Marker",
      "findbarrx@blueprintit.co.uk": "/Find Bar/",
      "findinnumbers@mozilla.org": "Find In Numbers",
      "{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}": "XUL/Migemo"
    }

    var list = this.getAddonsList();

    var conflictsFound = [];
    var len = list.length;

    for (var j = 0; j < len; j++) {
      var curExt = list[j];
      if (incompatibleExtensions[curExt]) {
        conflictsFound.push(incompatibleExtensions[curExt]);
      }
    }

    if (conflictsFound.length) {

      var compatWindow = window.openDialog("chrome://findintabs/content/checkCompat.xul",
                            "compatCheckWindow", "centerscreen,chrome,dialog", conflictsFound);
    }
  },

  getAddonsList: function _getAddonsList() {
  	var extensionDir = Components.classes["@mozilla.org/file/directory_service;1"]
                          .getService(Components.interfaces.nsIProperties)
                          .get("ProfD", Components.interfaces.nsIFile);
    extensionDir.append("extensions");
  	var entries = extensionDir.directoryEntries;

  	var list = [];

    while (entries.hasMoreElements()) {
  		var entry = entries.getNext();
  		entry.QueryInterface(Components.interfaces.nsIFile);
  		if (!entry.isDirectory())
        continue;
  		var guid = entry.leafName;
  		list.push(guid);
  	}
  	return list;
  },

 find: function _find(aValue) {
    var val = aValue || gFindBar._findField.value;

    gFindBar.searchItem = val;
    gFindBar._updateCaseSensitivity(val);



    if (gFindBar._findMode != gFindBar.FIND_NORMAL)
      gFindBar._setFindCloseTimeout();

    this.clearList();

    var numTabs = gBrowser.browsers.length;

    for (var i = 0; i < numTabs; i++) {
      var frames = this.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
      var thisFrame = null;
      var body = null;

      for (var j = 0; thisFrame = frames[j]; j++) {

        if (!(thisFrame.document) || !(body = thisFrame.document.body))
    	   continue;

        var count = body.childNodes.length;
        var searchRange = this.newRange(body, 0, body, count);
        var startPt = this.newRange(body, 0, body, 0);
        var endPt = this.newRange(body, count, body, count);
        var findRange = null;
        var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"]
                               .createInstance()
                               .QueryInterface(Components.interfaces.nsIFind);
        finder.caseSensitive = gFindBar._shouldBeCaseSensitive(val);

        while ((findRange = finder.Find(val, searchRange, startPt, endPt))
          && (this.searchResults.length <= this.maxResults)) {

          var validResult = false;

  				if (gFindBar._findMode == gFindBar.FIND_LINKS) {
  				  // If the result is not in an "a", it's not valid!
            var el = findRange.startContainer;
            while (el) {
              if ((el.tagName && (el.tagName.toLowerCase() == "a"))) {
                validResult = true;
                break
              }
              el = el.parentNode;
            }
          } else {
            validResult = true;
          }
          if (validResult) {
            /* Do the highlighting*/
    				var highlightedNode = this.highlight(findRange);
    				var resultRange = document.createRange();
    				resultRange.selectNode(highlightedNode);

    				this.searchResults.push(new this.result(resultRange, i));
    				/* Set startPt to be after the highlighted node. */
    				startPt = document.createRange();
    				startPt.setStartAfter(highlightedNode);
    				startPt.collapse(false);
          } else {
    				startPt = document.createRange();
    				startPt = findRange;
    				startPt.collapse(false);
          }
        }

        //cleanup
        startPt.detach();
        searchRange.detach();
        endPt.detach();
      }
    }
    // set findbar status
    if (this.searchResults.length) {
      this.populateList();
      this.updateFindStatus(true);

    } else {
      gFindBar._findStatusIcon.setAttribute("status", "notfound");
      gFindBar._findStatusDesc.textContent = gFindBar._notFoundStr;
      gFindBar._findField.setAttribute("status", "notfound");
      this.clearList();
      this.playSound();

    }

  },

  clearList: function _clearList(delHighlight) {
    // remove list children and zero out the results array, etc.
    if(delHighlight == undefined) {
      delHighlight = true; // Optional param to remove the highlighting
    }
    this.resultsList.empty()
    this.searchResults.length = 0;

    var numTabs = gBrowser.browsers.length;
    var doc = null;
    var selectedIndex = gBrowser.getBrowserIndexForDocument(gBrowser.selectedBrowser.contentDocument);

    for (var i = 0; i < numTabs; i++) {
      if( (!delHighlight) && selectedIndex == i) { //Skip unhighlighting the selected tab if highlighting
	continue;
      }
      var frames = findInTabs.getFrames(new Array(), gBrowser.getBrowserAtIndex(i).contentWindow);
      var thisFrame = null;
      for (var j = 0; thisFrame = frames[j]; j++) {
        var doc = thisFrame.document;
	this.removeHighlight(doc)
      }
    }

  },

  toggleResultsList: function _toggleResultsList(aFindInTabs) {
    this.isFindInTabs = aFindInTabs;
    this.resultsBox.attr('hidden', !this.isFindInTabs);
    this.splitter.attr('hidden', !this.isFindInTabs);

    if (this.isFindInTabs) {

      this.wasHighlighted = gFindBar.getElement("highlight").checked; // Remember status of highlight

      gFindBar.getElement("highlight").checked = false;
      gFindBar.getElement("highlight").disabled = true;
      this.statusLabel.attr('value', this.strings.getFormattedString("findInTabsStatus", []));
      this.statusLabel.attr('hidden', (gFindBar._findMode == gFindBar.FIND_NORMAL));
      this.resizeColumns();
    } else {
      this.clearList(!this.wasHighlighted);
      this.statusLabel.attr('value', "");
      gFindBar.getElement("highlight").checked = this.wasHighlighted; // Remember status of highlight
      gFindBar.getElement("highlight").disabled = false;
    }
    if (gFindBar._findField.value)
      gFindBar._find();

    gFindBar._findField.focus();
  },

  onSelectItem: function _selectItem() {
    var list = this.resultsList;
    if (!this.searchResults[list.attr('currentIndex')])
      return;

    var tabNum = this.searchResults[list.attr('currentIndex')].ownerTab;
    var range =  this.searchResults[list.attr('currentIndex')].range;

    gBrowser.mTabContainer.selectedIndex = tabNum;
    var win = gBrowser.getBrowserAtIndex(tabNum).contentWindow;
    var sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    var node = range.startContainer.parentNode;
    node.scrollIntoView(true);
    //win.focus();
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
      statusIcon.setAttribute("status", "findintabs-results");

      if (len == 1) {
        statusText.textContent = this.strings.getFormattedString("findOneResultStatusMessage", [len]);
      }
      else if (len > this.maxResults) {
         statusText.textContent = this.strings.getFormattedString("findResultsTooMany", [this.maxResults]);
      }
      else {
        statusText.textContent = this.strings.getFormattedString("findResultStatusMessage", [len]);
      }

      findField.removeAttribute("status");
      findPrev.disabled = false;
      findNext.disabled = false;
    }
    else if (statusIcon.getAttribute("status") == "findintabs-results") {
      statusText.textContent = "";
      statusIcon.removeAttribute("status");
      findField.setAttribute("status", "notfound");
      findPrev.disabled = true;
      findNext.disabled = true;
    }
  },

  // Returns the favicon URI given a tab number (integer)
  getFaviconURI: function _getFaviconURI (pTabnum) {
  	var tabnum = pTabnum;
  	var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
                            .getService(Components.interfaces.nsIFaviconService);
  	return faviconService.getFaviconImageForPage(gBrowser.getBrowserAtIndex(tabnum).currentURI).spec;
  },

  populateList: function _populateList () {
    var scrollIndex = this.maxResults + 1; // Used to scroll to the current tab.
    var findField = gFindBar._findField;
    var list = document.getElementById("findintabs-results-list");
    var item = null;
    var isMatchingTab = false;
    var lastTab = 0; // Place marker for colouring tabs.
    var tabCount = 0;

    for (var i = 0; item = this.searchResults[i]; i++) {
      var listItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
        "richlistitem");

      var tabNum = item.ownerTab + 1;
      var tabTitle = gBrowser.getBrowserAtIndex(item.ownerTab).contentDocument.title;

      listItem.setAttribute("context", "findintabs-context-menu");

      if(lastTab < tabNum) { // Count on tab change.
	  lastTab = tabNum;
	  tabCount++;
      }

      if(tabCount % 2 == 0) {
	  listItem.setAttribute("class", "findintabs-results-list-item findintabs-result-different ");
      }



      if((gBrowser.tabContainer.selectedIndex == item.ownerTab) && (i < scrollIndex)) {
	  scrollIndex = i;
      }

      //getting range text and some text before and after
      var range = item.range;
      var rangeText = range.toString();

      var beforeRange = document.createRange();
      beforeRange.selectNodeContents(range.startContainer);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      var beforeText = beforeRange.toString();
      if (beforeText.length > 80)
        beforeText = beforeText.substr(beforeText.length - 80, 80);

      var afterRange = document.createRange();
      afterRange.selectNodeContents(range.endContainer);
      afterRange.setStart(range.endContainer, range.endOffset);
      var afterText = afterRange.toString();
      if (afterText.length > 80)
        afterText = afterText.substr(0, 80);

      var tabString = this.strings.getFormattedString("findInTabsTab", []) + " #" + tabNum;

      var hbox = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "hbox");
      hbox.setAttribute("align", "center");

      if (this.showFavicon) {
	  var faviconURI = this.getFaviconURI(item.ownerTab);
    	  var faviconCell = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "image");
    	  faviconCell.setAttribute("class", "findintabs-favicon");
    	  faviconCell.setAttribute("src", faviconURI);
    	  faviconCell.setAttribute("tooltiptext", tabString + ": " + tabTitle);
    	  hbox.appendChild(faviconCell);
      }

      var cell1 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      cell1.setAttribute("class", "findintabs-results-list-tabnumber");
      cell1.setAttribute("value", tabString);
      cell1.setAttribute("tooltiptext", tabString + ": " + tabTitle);

      var cell2 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
      cell2.setAttribute("class", "findintabs-results-list-tabtitle");
      cell2.setAttribute("value", tabTitle);
      cell2.setAttribute("crop", "end");
      cell2.setAttribute("tooltiptext", tabString + ": " + tabTitle);

      var cell3 = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "description");
      cell3.setAttribute("crop", "end");
      cell3.setAttribute("class", "findintabs-results-list-text");

      var rangeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var beforeSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      var afterSpan = document.createElementNS("http://www.w3.org/1999/xhtml", "span");

      rangeSpan.setAttribute("class", "findintabs-results-list-highlight");

      var rangeSpanText = document.createTextNode(rangeText);
      var beforeSpanText = document.createTextNode(beforeText);
      var afterSpanText = document.createTextNode(afterText);

      beforeSpan.appendChild(beforeSpanText);
      rangeSpan.appendChild(rangeSpanText);
      afterSpan.appendChild(afterSpanText);

      cell3.appendChild(beforeSpan);
      cell3.appendChild(rangeSpan);
      cell3.appendChild(afterSpan);
      cell3.setAttribute("tooltiptext", cell3.textContent);

      hbox.appendChild(cell1);
      hbox.appendChild(cell2);
      hbox.appendChild(cell3);

      listItem.appendChild(hbox);
      list.appendChild(listItem);
    }
    if(scrollIndex <= this.maxResults)
      list.scrollToIndex(scrollIndex);

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
    if (aDocument) {
      var nodeList = aDocument.getElementsByClassName(aClassName);
      var len = nodeList.length;
      var elem = null;
      for (var i = len - 1; i >= 0; i--) {
        elem = nodeList.item(i);
        var parent = elem.parentNode;

  	    var child = null;
        while ((child = elem.firstChild)) {
          parent.insertBefore(child, elem);
        }

        parent.removeChild(elem);
        parent.normalize();

      }
    }
  },

  copyText: function _copyText() {
    var range = this.searchResults[this.resultsList.attr('currentIndex')];

    var text = this.resultsList[0].getSelectedItem(0).textContent;

    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                             getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(text);

  },

  onKeyPress: function _onKeyPress(aEvent) {
    if(aEvent.keyCode == aEvent.DOM_VK_ESCAPE)
      gFindBar.close();
  },

  playSound: function _playSound() {
    if (this.enableSound && this.soundURL) {
      var sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
      if (this.soundURL == 'beep')
        sound.beep();
      else {
        sound.play(this.soundURL);
      }
    }
  },

  onCloseButton: function _onCloseButton() {
    gFindBar.getElement("highlight").checked = this.wasHighlighted; // Remembers whether we were highlighting prior.
    gFindBar.getElement("highlight").disabled = false;
    this.checkbox.attr('checked', false);
    gFindBar._setFindInTabs(false);
  },

  resizeColumns: function _resizeColumns() {
    var width = this.tabTitleLabel[0].boxObject.width + "px";
    this.tabtitleStyle.style.setProperty("width", width, "important");
    width = this.tabNumberLabel[0].boxObject.width + "px";
    this.tabnumberStyle.style.setProperty("width", width, "important");
  },

}

// overload functions of the findbar to take advantage of fintintabs
var findBarOverLoad = {
  onLoad: function _onLoad() {

    // override closeing of the findbar to close the results bar too.
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function _newClose() {
      findInTabs.clearList();
      findInTabs.resultsBox.hidden = true;
      findInTabs.splitter.hidden = true;
      return gFindBar.close_old();
    }

    // override opening of the findbar to open the results bar too if it"s set
    gFindBar.open_old = gFindBar.open;
     gFindBar.open = function _newOpen(aMode) {

      var retVal = gFindBar.open_old(aMode);

      findInTabs.toggleResultsList(findInTabs.isFindInTabs);

      return retVal;
    }

    //overload the next/prev buttons functions
    gFindBar.onFindAgainCommand_old = gFindBar.onFindAgainCommand;
    gFindBar.onFindAgainCommand = function _newOnFindAgainCommand(aFindPrevious) {
      if (findInTabs.isFindInTabs) {
        var list = findInTabs.resultsList[0];
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
        if (findInTabs.findTimeout)
          window.clearInterval(findInTabs.findTimeout);

        findInTabs.findTimeout = window.setTimeout(function() { findInTabs.find(aValue); }, findInTabs.findDelay);
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
