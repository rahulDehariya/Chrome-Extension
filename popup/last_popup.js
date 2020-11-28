chrome.browserAction.onClicked.addListener(function() {
    chrome.windows.getCurrent(function(win) {
        var width = 440;
        var height = 220;
        var left = ((screen.width / 2) - (width / 2)) + win.left;
        var top = ((screen.height / 2) - (height / 2)) + win.top;

        chrome.windows.create({
            url: '../popup/last_popup.html',
            width: width,
            height: height,
            top: Math.round(top),
            left: Math.round(left),
            type: 'popup'
        });
     });
  });

