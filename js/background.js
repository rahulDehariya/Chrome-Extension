var imgData = null;
var IsUploadFinished = false;
var success          = false;
var info        = null;
var redirectUrl = "https://app.upclip.com/sign-in";
var authToken   = null;
var projects    = []; 
var base_url    = "https://app.upclip.com";
var selectedImg = null;
var selectedCoordinate = null;
var saveWindow =null;
var projectWindow =null;
var uploaded_post = null;

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.name == 'background.takeScreenShot.currentView') {
    chrome.tabs.captureVisibleTab(
      null,
      {
        format: request.settings.type.trim(),
        quality: request.settings.quality
      },
      function(dataUrl) {
        selectedImg =dataUrl; 
        selectedCoordinate = request.coords;
        openViewPage(dataUrl, request.coords); // on capture area
        // setTimeout(function(){
        //    sendResponse({status: true});
        //  }, 1);
      }
    );

  }

  else if(request.name =='background.takeScreenShot.captureVisible')
  {
    chrome.tabs.captureVisibleTab(
      null,
      {
        format: request.settings.type.trim(),
        quality: request.settings.quality
      },
      function(dataUrl) {

        
        if(authToken){
         // upload visible area on server
         let req = {file:dataUrl,name:'captureVisible'}
         upload(req);
        
        }
        

      }
    );

  }
  else if(request.name =='set_auth_token')
  {
    setToken(request.token);
  }
  else if(request.name =='capture_intire_page')
  {

    takeScreenshot.initialize();
    // let req = {name:"capture_intire_page"};
    //  messageToCurrentTab(req)
  }
  else if(request.name =='upload_intire_page')
  {
    upload(request);

  }
  else if(request.name =='check_token')
  {
    checkToken();
  }
  else if(request.name =='projects')
  {
    sendResponse({projects: projects});
  }
  else if(request.name =='upload_post')
  {
    upload(request);
  }
  else if(request.name =='fetch_projects')
  {
    sendResponse({projects: projects});
  }
  else if(request.name =='setPageDetails')
  {
   takeScreenshot.customMethod(request);
  }
  else if(request.name =='capturePage')
  {
   takeScreenshot.customMethod(request);
  }
  else if(request.name =='save_projects')
  {
    saveProject(request);
  }
  else
  {
    alert('from backgrounf: '+request.name+'--'+request.msg)
  }
   setTimeout(function() {
        sendResponse({status: true});
    }, 1);
    return true;  // uncomment this line to fix error

});



function OpenProjectPopup(){

  chrome.runtime.sendMessage({name: "openProjectPopup"});
}


function ShowSavingPopup(){

  chrome.runtime.sendMessage({name: "ShowSavingPopup"});
}


function sendProject()
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          let req = {projects:projects,name:"projects"};
          chrome.tabs.sendMessage(tabs[0].id, req, function(response) {});
      });
}

function messageToCurrentTab(req)
{
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, req, function(response) {});
      });
}


function test()
{
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
              });
            });
}


var contentURL = '';
function openViewPage(dataURI, coords) {

  // alert('Open view Called');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

      let req = {dataURI:dataURI,coords:coords,name:"upload_image"};
      chrome.tabs.sendMessage(tabs[0].id, req, function(response) {});
  });
}

function CheckAuthToken(){

  token = chrome.storage.local.get(['jwt'], function(result) {
           if(result.jwt)
           {
             authToken =result.jwt; 
             return authToken;
           }
           else
           {
            return null;
           }
        });

}


function checkToken()
{
  token = chrome.storage.local.get(['jwt'], function(result) {
           if(result.jwt)
           {
             authToken =result.jwt; 
             fetchProjects();
           }
           else
           {
             window.open(redirectUrl);
           }
        });
}


function setToken(token='')
{
  if(!token)
  {
    // alert("You are not login into website.")
  }
    chrome.storage.local.set({'jwt': token}, function() {
           // alert("set token: "+token); 
    });
}


function fetchProjects(refresh=false)
{
    if(projects.length==0 || refresh)
    {
      // alert('Fetching project from server')
      let param = {token:authToken,project:projects};
      let header = {'authorization':'Bearer '+authToken}  
       $.ajax({
        url: base_url+'/api/v1/projects',
        headers: {
            'authorization':'Bearer '+authToken
        },
        method: 'GET',
        success: function(data){
          if(data)
          {
            data.forEach(element=>{
              let pro = {name:element.name,id:element._id}
                  projects.push(pro);
            })
          }
        }
      });
    }
    else
    {
      // alert('Allready We have fetched')
    }
}

function upload(req)
{  

 

  if(req.name=='upload_by_url' || req.name=='upload_post'){
    
    openSavingPopup();
 }
 else{
  ShowSavingPopup();

 }


   var formData = new FormData();
       fetch(req.file).then(res => res.blob()).then(blob => {
              const file = new File([blob], "filename.jpeg");
                    formData.append('file',file);
                    $.ajax({
                              type:'POST',
                              url: base_url+'/api/v1/upload-image',
                              headers: {
                              'authorization':'Bearer '+authToken
                              },
                              data:formData,
                              cache:false,
                              contentType: false,
                              processData: false,
                              success:function(data){
                                uploaded_post = data._id

                                if(req.name=='upload_by_url' || req.name=='upload_post'){
                                  closeSaving();
                                }
                                else if(req.name=='capture_intire_page'){
                                  OpenProjectPopup();
                                }
                                else if(req.name=='captureVisible'){
                                 
                                   OpenProjectPopup();
                                }
                                else if(req.name=='upload_intire_page'){
                                   OpenProjectPopup();
                                }
                                

                              },
                              error: function(data){
                                  alert("file upoad error "+data.responseText);
                                  // FileUploadIssuePopup();
                              }
                          });
       })

        
}

function saveProject(req)
{
  // alert('save the project: '+req.project_id)
  // alert('save the post: '+uploaded_post);
                    var param = {projectId:req.project_id,tags:[]};
                    $.ajax({
                              type:'PUT',
                              url: base_url+'/api/v1/posts/add-to-project/'+uploaded_post,
                              headers: {
                              'authorization':'Bearer '+authToken,
                              "content-type": "application/json",
                              },
                              data:JSON.stringify(param),

                              cache:false,
                              contentType: false,
                              processData: false,
                              success:function(data){
                                // alert("added to project")
                              },
                              error: function(data){
                                // alert(data.responseText);
                              }
                          });
                          closeProject();
}
// create new context menu for only images
      chrome.contextMenus.create({
      title: "Add image to Upclip", 
      contexts:["image"],
      onclick: function(e){


         
          // // fetch img url
          let req = {file:e.srcUrl,name:"upload_by_url"};
        uploadByContextMenus(req);
          // upload(req); // upload image to server
        
      }

  }, function(){})


  function uploadByContextMenus(req){

    token = chrome.storage.local.get(['jwt'], function(result) {
           if(result.jwt)
           {
             authToken =result.jwt;
              
           
            upload(req); // upload image to server 
            
           }
           else
           {
             window.open(redirectUrl);
           }
        });
  }


function openSavingPopup()
{
  var width = 300;
  var height = 150;
  var left = (screen.width/2)-(width/2);
  var top = (screen.height/2)-(height/2);
  saveWindow = window.open('/popup/saving.html','winname','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width='+width+',height='+height+',top=200,left='+left);
}

function closeSaving()
{
  saveWindow.close();
  openProjectWindow();
}

function FileUploadIssuePopup()
{
  var width  = 300;
  var height = 150;
  var left = (screen.width/2)-(width/2);
  var top = (screen.height/2)-(height/2);
  saveWindow = window.open('/popup/saving.html','winname','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width='+width+',height='+height+',top=200,left='+left);
}

function openProjectWindow(){
  let width  = 326
  let height = 246;
  let left = (screen.width/2)-(width/2);
  let top = (screen.height/2)-(height/2);
  projectWindow = window.open('/popup/project-popup.html','winname2','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width='+width+',height='+height+',top=200,left='+left);
}

function closeProject()
{
  projectWindow.close();
}


//////////////for capture intire page
var takeScreenshot = {
  /**
   * @description ID of current tab
   * @type {Number}
   */
  tabId: null,

  /**
   * @description Canvas element
   * @type {Object}
   */
  screenshotCanvas: null,

  /**
   * @description 2D context of screenshotCanvas element
   * @type {Object}
   */
  screenshotContext: null,

  /**
   * @description Number of pixels by which to move the screen
   * @type {Number}
   */
  scrollBy: 0,

  /**
   * @description Sizes of page
   * @type {Object}
   */
  size: {
    width: 0,
    height: 0
  },

  /**
   * @description Keep original params of page
   * @type {Object}
   */
  originalParams: {
    overflow: "",
    scrollTop: 0
  },

  /**
   * @description Initialize plugin
   */
  initialize: function () {
    this.screenshotCanvas = document.createElement("canvas");
    this.screenshotContext = this.screenshotCanvas.getContext("2d");
    this.bindEvents();

  },

  /**
   * @description Bind plugin events
   */
  bindEvents: function () {
    // handle onClick plugin icon event
 
      let req = {"name": "getPageDetails" }
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            this.tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabs[0].id, req, function(response) {
          });
      }.bind(this));


  },
  customMethod:function(request)
  {
        if (request.name === "setPageDetails") {
        this.size = request.size;
        this.scrollBy = request.scrollBy;
        this.originalParams = request.originalParams;

        // set width & height of canvas element
        this.screenshotCanvas.width = this.size.width;
        this.screenshotCanvas.height = this.size.height;

        this.scrollTo(0);
      } else if (request.name === "capturePage") {

        this.capturePage(request.position, request.lastCapture);
      }
  },

  /**
   * @description Send request to scroll page on given position
   * @param {Number} position
   */
  scrollTo: function (position) {
    chrome.tabs.sendMessage(this.tabId, {
      "name": "scrollPage",
      "size": this.size,
      "scrollBy": this.scrollBy,
      "scrollTo": position
    });
  },

  /**
   * @description Takes screenshot of visible area and merges it
   * @param {Number} position
   * @param {Boolean} lastCapture
   */
  capturePage: function (position, lastCapture) {
    var self = this;

    setTimeout(function () {
      chrome.tabs.captureVisibleTab(null, {
        "format": "png"
      }, function (dataURI) {
       
        var newWindow,
          image = new Image();
        if (typeof dataURI !== "undefined") {
          image.onload = function() {
            self.screenshotContext.drawImage(image, 0, position);

            if (lastCapture) {
              self.resetPage();
              let fullPageImg = self.screenshotCanvas.toDataURL("image/png");
              let pera = {file:fullPageImg,name:"capture_intire_page"};
              upload(pera);

            } else {
              self.scrollTo(position + self.scrollBy);
            }
          };

          image.src = dataURI;
        } else {
          chrome.tabs.sendMessage(self.tabId, {
            "name": "showError",
            "originalParams": self.originalParams
          });
        }
      });
    }, 300);
  },

  /**
   * @description Send request to set original params of page
   */
  resetPage: function () {
    chrome.tabs.sendMessage(this.tabId, {
      "name": "resetPage",
      "originalParams": this.originalParams
    });
  }
};

function saveToLocal(data)
{
  alert('saving to local')
  let param = {name:'test file',content:data};
  $.post("http://localhost/test.php",param,function(res){
    alert(res)
  })
}



