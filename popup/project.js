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

   // add uploaded post  with selected project
   document.getElementById("saveProject").addEventListener('click',function(){
     let id = document.getElementById("projectOption").value;
     let request = {name:"save_projects",project_id:id}
      chrome.runtime.sendMessage(request, function(response) {
        window.close();

    });

     
   })



    
