var base_url = "https://app.upclip.com";
var domain   = "app.upclip.com";
var currentDomain  = window.location.hostname;
FetchToken();

function resetPage(originalParams) {
	window.scrollTo(0, originalParams.scrollTop);
	document.querySelector("body").style.overflow = originalParams.overflow;
}

// window.onload = function() {
//     chrome.extension.sendMessage({
// 		"name": "fetch_projects"
// 	});
// }

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    // alert('I got the message: '+request.name+'--'+request.msg)
	switch (request.name) {
		case "upload_image":
			genrateCamptureImg(request)
			break;
		case "projects":
			setProject(request)
			break;
		case "capture_intire_page":
			captureIntirePage();
			break;
		case "getPageDetails":
			var size = {
				width: Math.max(
					document.documentElement.clientWidth,
					document.body.scrollWidth,
					document.documentElement.scrollWidth,
					document.body.offsetWidth,
					document.documentElement.offsetWidth
				),
				height: Math.max(
					document.documentElement.clientHeight,
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.offsetHeight
				)
			};

			chrome.extension.sendMessage({
				"name": "setPageDetails",
				"size": size,
				"scrollBy": window.innerHeight,
				"originalParams": {
					"overflow": document.querySelector("body").style.overflow,
					"scrollTop": document.documentElement.scrollTop
				}
			});
			break;

		case "scrollPage":
			var lastCapture = false;

			window.scrollTo(0, request.scrollTo);

			// first scrolling
			if (request.scrollTo === 0) {
				document.querySelector("body").style.overflow = "hidden";
			}

			// last scrolling
			if (request.size.height <= window.scrollY + request.scrollBy) {
				lastCapture = true;
				request.scrollTo = request.size.height - request.scrollBy;
			}

			chrome.extension.sendMessage({
				"name": "capturePage",
				"position": request.scrollTo,
				"lastCapture": lastCapture
			});
			break;

		case "resetPage":
			resetPage(request.originalParams);
			break;

		case "showError":
			var errorEl = document.createElement("div");

			errorEl.innerHTML = "<div style='position: absolute; top: 10px; right: 10px; z-index: 9999; padding: 8px; background-color: #fff2f2; border: 1px solid #f03e3e; border-radius: 2px; font-size: 12px; line-height: 16px; transition: opacity .3s linear;'>An internal error occurred while taking pictures.</div>";
			document.body.appendChild(errorEl);

			setTimeout(function () {
				errorEl.firstChild.style.opacity = 0;
			}, 3000);

			resetPage(request.originalParams);
			break;
		default:
		 alert("Unknown method called: "+request.name+'--'+request.msg)
		    
	}
	 setTimeout(function() {
        sendResponse({status: true});
    }, 1);
    return true;  // uncomment this line to fix error
});

function setProject(request)
{
   console.log('Need to set this all project: ',request);
   test = document.getElementById('popup_flight_travlDil1');
   console.log('test',test)
}

function FetchToken()
{
	if(currentDomain == domain)
	{
	     var token = localStorage.getItem('jwt');
	     if(!token)
	     {
	     }
	     let request = {name:"set_auth_token",token:token}
		   chrome.runtime.sendMessage(request, function(response) {
		 });
	}
	else
	{
	}
}

function login()
{
 window.location =base_url;
}

function UploadCaptureArea()
{

}

function genrateCamptureImg(request)
{
  console.log("Capture area: ",request)

  var canvasReference   = document.createElement('canvas');
  const base64ImageData = request.dataURI 
  const myCrop = {
			       x: request.coords.x,
			       y: request.coords.y,
			       width: request.coords.w,
			       height: request.coords.h
			     }
  ConvertSelectedImg(canvasReference, base64ImageData, myCrop);
}

function ConvertSelectedImg(canvasRef, image64, pixelCrop)
     	{
     		// return canvasRef;
					  const canvas = canvasRef // document.createElement('canvas');
					  canvas.width = pixelCrop.width;
					  canvas.height = pixelCrop.height;
					  const ctx = canvas.getContext('2d');
					  const image = new Image()
					  image.src = image64
					  image.onload = function() {
					      ctx.drawImage(
					        image,
					        pixelCrop.x,
					        pixelCrop.y,
					        pixelCrop.width,
					        pixelCrop.height,
					        0,
					        0,
					        pixelCrop.width,
					        pixelCrop.height
					      )
					      let base64 =canvasRef.toDataURL()  
					      base64ToImg(base64);
					    }
        }

	
    
function base64ToImg(base64)
{
	  // upload img on server
    let request = {name:"upload_post",file:base64}
    chrome.runtime.sendMessage(request, function(response) {
    });
}

function captureIntirePage()
{
    html2canvas(document.body, {
      onrendered: function(canvas)  
      {
        var img = canvas.toDataURL();
        let request = {name:"upload_intire_page",file:img}
	    chrome.runtime.sendMessage(request, function(response) {
        });

      }
    });
} 