 let request = {name:"fetch_projects"}
    chrome.runtime.sendMessage(request, function(response) {
      var projectOption = "";
      var myProject =(response.projects)?response.projects:[]; 
      for(i=0;i<myProject.length;i++)
      {
        projectOption += '<option value="'+myProject[i].id+'">'+myProject[i].name+'</option>'
      }
      document.getElementById("projectOption").innerHTML = projectOption;

    });

