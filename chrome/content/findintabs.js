
var _findintabs = {

  onLoad: function() {
  
    var resultslist = document.getElementById('findintabs-results-list');
    
    // overrride closeing of the findbar to close the results bar too
    gFindBar.close_old = gFindBar.close;
    gFindBar.close = function() {
      resultslist.hidden = true;
      return gFindBar.close_old(); 
    }
    
    // overrride opening of the findbar to open  the results bar too if it's set
    gFindBar.open_old = gFindBar.open;
    gFindBar.open = function() {
      resultslist.hidden = !(document.getElementById('isFindInTabs').status);
      return gFindBar.open_old();  
    }  
    
  },
  
  //function to be called when checkbox is clicked
  setstatus: function(){
    isChecked = document.getElementById('find-findintabs-check').checked;
    document.getElementById('isFindInTabs').status = isChecked;
    document.getElementById('findintabs-results-list').hidden = !isChecked;
  },
  
  //fucntion to be called when a result in the list is clickedf
  selectresult: function(id) {
    alert("This box should probably do something when result #" + id + " is selected." );
    
  }

}

window.addEventListener("load", _findintabs.onLoad, false);


