
var screenshot,
  contentURL = '';
var settings = {};
//
// Set up Event Handlers and Views as well as load in settings
//
document.addEventListener('DOMContentLoaded', function() {
  //Hide <div> tags
  hide('capturing_page');
  hide('loader');
  hide('uh-oh');
  hide('invalid');

  hide('wrap');
  //document.getElementById("loader").style.visibility = "hidden";
  //hide('bar');

  // Use default value color = 'Entire Page' and likesColor = true.
  chrome.storage.sync.get(
    {
      value_imgType: 'png',
      value_imgQuality: '100%'
    },
    function(items) {
      console.log(items.value_imgType);
      console.log(items.value_imgQuality);
      settings.type = items.value_imgType;
      settings.quality = parseInt(items.value_imgQuality);
    }
  );

 
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      
        if (request.name == "openProjectPopup") {

            hide('popup_flight_saving');
           
             show('popup_flight_projectPopup');
          
          
        }
        else if(request.name == "ShowSavingPopup")
        {
           show('popup_flight_saving');
        }
    }
);

function doSomeProcessing(msg) {
  return new Promise(resolve => {
    // do something async
    resolve({data: 123});
  });
}


  // chrome.extension.onRequest.addListener(onMessage);

  //Get Element ID's
  var btnCaptureFullPage  = document.getElementById('btnCaptureFullPage');
  var btnCurrentPageView  = document.getElementById('btnCurrentPageView');
  var btnCaptureSelection = document.getElementById('btnCaptureSelection');
  var btnCaptureVisiable  = document.getElementById('btnCaptureVisiable');
  var btnCapturePullPage  = document.getElementById('btnCapturePullPage');
  var btnOptions          = document.getElementById('btnOptions');
  var upclipUrl          = document.getElementById('upclipUrl');



  upclipUrl.addEventListener('click', function() {
    var href='https://app.upclip.com/';
    chrome.tabs.create({url:href})
  })

  btnCaptureVisiable.addEventListener('click', function() {
       CheckAuth();

        // hiding Main popup
          hide('clr');
        // Showing saving popup
         
       chrome.extension.sendMessage(
        {
          name: 'background.takeScreenShot.captureVisible',
          settings: settings
        },
        function(response) {
          //   hiding  saving popup
        
           
            

          console.log('captureed area',response.capture)
          return true;
        }
      );

  })
  btnCapturePullPage.addEventListener('click', function() {
      CheckAuth();
        // hiding Main popup
        hide('clr');
        // Showing saving popup
        show('popup_flight_saving');
      chrome.extension.sendMessage(
        {
          name: 'capture_intire_page',
        },
        function(response) {

         
           
          // console.log('captureed area',response.capture)
          return true;
        }
      );
  })

  btnCaptureSelection.addEventListener('click', function() {
    CheckAuth();
    chrome.tabs.query({ active: true, highlighted: true }, function(tabs) {
      if (testURLMatches(tabs[0].url)) {
        chrome.tabs.executeScript(
          tabs[0].id,
          { file: 'js/capture_crop.js' },
          function() {
            var path = chrome.extension.getURL('') + 'js/capture_crop.css';
            console.log(path);
            var link = document.createElement('link');
            link.href = path;
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.media = 'screen,print';
            document.getElementsByTagName('head')[0].appendChild(link);
            sendMessage({ msg: 'StartCropCapture', settings: settings });
            window.close();
          }
        );
      } else {
        hide('capturing_page');
        show('invalid');
      }
    });
  });
});

function onMessage(request, sender, callback) {

  alert(request.name);
  alert("I am  getting message")
  if (request.msg == 'capturePage') {
    capturePage(request, sender, callback);
  } else {
    console.error(
      'Unknown message received from content script: ' + request.msg
    );
  }
}

//
// console object for debugging
//
var log = (function() {
  var parElt = document.getElementById('wrap'),
    logElt = document.createElement('div');
  logElt.id = 'log';
  logElt.style.display = 'block';
  parElt.appendChild(logElt);

  return function() {
    var a,
      p,
      results = [];
    for (var i = 0, len = arguments.length; i < len; i++) {
      a = arguments[i];
      try {
        a = JSON.stringify(a, null, 2);
      } catch (e) {}
      results.push(a);
    }
    p = document.createElement('p');
    p.innerText = results.join(' ');
    p.innerHTML = p.innerHTML.replace(/ /g, '&nbsp;');
    logElt.appendChild(p);
  };
})();

//
// utility methods
//
function $(id) {
  return document.getElementById(id);
}
function show(id) {
  $(id).style.display = 'block';
}
function hide(id) {
  $(id).style.display = 'none';
}

//
// URL Matching test - to verify we can talk to this URL
//
var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
  noMatches = [/^https?:\/\/chrome.google.com\/.*$/];
function testURLMatches(url) {
  // couldn't find a better way to tell if executeScript
  // wouldn't work -- so just testing against known urls
  // for now...
  var r, i;
  for (i = noMatches.length - 1; i >= 0; i--) {
    if (noMatches[i].test(url)) {
      return false;
    }
  }
  for (i = matches.length - 1; i >= 0; i--) {
    r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
    if (r.test(url)) {
      return true;
    }
  }
  return false;
}

function sendMessage(msg) {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, msg, function(response) {
      console.log(response);
    });
  });
}

function sendScrollMessage(tab) {
  contentURL = tab.url;
  screenshot = {};
  chrome.tabs.sendRequest(tab.id, { msg: 'scrollPage' }, function(coords) {
    // We're done taking snapshots of all parts of the window. Display
    // the resulting full screenshot image in a new browser tab.
    sendLogMessage(coords);
    openViewWithCoords(screenshot.canvas.toDataURL(), coords);
  });
}

function sendLogMessage(data) {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(
      tab.id,
      { msg: 'logMessage', data: data },
      function() {}
    );
  });
}

function capturePage(data, sender, callback) {
  var canvas;

  $('bar').style.width = parseInt(data.complete * 100, 10) + '%';

  // Get window.devicePixelRatio from the page, not the popup
  var scale =
    data.devicePixelRatio && data.devicePixelRatio !== 1
      ? 1 / data.devicePixelRatio
      : 1;

  // if the canvas is scaled, then x- and y-positions have to make
  // up for it
  if (scale !== 1) {
    data.x = data.x / scale;
    data.y = data.y / scale;
    data.totalWidth = data.totalWidth / scale;
    data.totalHeight = data.totalHeight / scale;
  }

  if (!screenshot.canvas) {
    canvas = document.createElement('canvas');
    canvas.width = data.totalWidth;
    canvas.height = data.totalHeight;
    screenshot.canvas = canvas;
    screenshot.ctx = canvas.getContext('2d');

    // sendLogMessage('TOTALDIMENSIONS: ' + data.totalWidth + ', ' + data.totalHeight);

    // // Scale to account for device pixel ratios greater than one. (On a
    // // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
    // if (scale !== 1) {
    //     // TODO - create option to not scale? It's not clear if it's
    //     // better to scale down the image or to just draw it twice
    //     // as large.
    //     screenshot.ctx.scale(scale, scale);
    // }
  }

  // sendLogMessage(data);

  chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 }, function(
    dataURI
  ) {
    if (dataURI) {
      var image = new Image();
      image.onload = function() {
        sendLogMessage(
          'img dims: ' +
            data.x +
            ', ' +
            data.y +
            ', ' +
            image.width +
            ', ' +
            image.height
        );
        screenshot.ctx.drawImage(image, data.x, data.y);
        callback(true);
      };
      image.src = dataURI;
    }
  });
}

function CheckAuth()
{
  chrome.runtime.sendMessage({name: "check_token"}, function(response) {
    console.log('checkAuth: ',response);
  });
}
// 
