var bkg = browser.extension.getBackgroundPage();

function alinkInit() {
  var links = document.getElementsByTagName("a");
  for (var i = 0; i < links.length; i++) {
    (function () {
      var ln = links[i];
      var location = ln.href;
      ln.onclick = function () {
        browser.tabs.create({active: true, url: location});
      };
    })();
  }
};

function rest(rootUrl, path, key, args, handler) {
  var url = rootUrl + '/' + path + "?key=" + key + args; 

	var errHandler = function(e) {
		if (e.message == 401) {
		} else {
			throw e;
		}
	};

	fetch(url)
		.then(function(resp){
			if (resp.status === 401) {
				throw Error(401);
			} else {
				return resp.json();
			}
		})
		.then(handler).catch(errHandler);
}

function restIssues(rootUrl, apiKey, id) {
  var redmineUrl = document.getElementById("redmine_url");
  while (redmineUrl.firstChild) {
    redmineUrl.removeChild(redmineUrl.firstChild);
  }

	rest(rootUrl, "issues.json", apiKey, "&assigned_to_id=" + id + "&limit=100&sort=updated_on:desc", function restHandleResponse(resp) {
    var aUrl = document.createElement("a");
    aUrl.setAttribute('href', rootUrl);
  	aUrl.innerText = rootUrl;			
    redmineUrl.appendChild(aUrl);

    var table = document.createElement('table');
    table.id = 'tickets';
    
    for (i in resp.issues) {
      var issue = resp.issues[i];

      var row = table.insertRow()
      row.className = i % 2 == 0 ? "even" : "odd";

      var id = document.createElement('a');
      id.setAttribute('href', rootUrl + "/issues/" + issue.id);
	  	id.innerText = issue.id;			
      row.insertCell(0).appendChild(id);  
    
      var project = document.createElement('a');
      project.setAttribute('href', rootUrl + "/projects/" + issue.project.id);
	  	project.innerText = issue.project.name;			
      row.insertCell(1).appendChild(project);  

      row.insertCell(2).innerText = issue.status.name;

      var subject = document.createElement('a');
      subject.setAttribute('href', rootUrl + "/issues/" + issue.id);
	  	var title = "Автор: " + issue.author.name + "\n" + issue.description
	  	subject.setAttribute('title', title);
	  	subject.innerText = issue.subject;			
      row.insertCell(3).appendChild(subject);    
    }
    
    var header = table.createTHead();
    var row = header.insertRow(0);  
    row.insertCell(0).innerText = "#";  
    row.insertCell(1).innerText = "Проект";  
    row.insertCell(2).innerText = "Статус";  
    row.insertCell(3).innerText = "Тема";  

    document.getElementById('issues').appendChild(table);
    
    alinkInit();

	})
  
}

function restCurrentUser(url, apiKey) {
	rest(url, "users/current.json", apiKey, "", function restHandleResponse(resp) {		
		var user = resp.user;

    browser.storage.sync.set({ 
    	apiKey : apiKey,
			id     : user.id,
			login  : user.login,
      url    : url
		});

		restIssues(url, apiKey, user.id);
	})
}

function load() {
	document.getElementById("inp_api_key").value = "";
  document.getElementById("inp_url").value = "";

  browser.storage.sync.get().then(function(keys){ 
    if (keys.apiKey)  {
  		document.getElementById("inp_api_key").value = keys.apiKey;
    }

    if (keys.url)  {
  		document.getElementById("inp_url").value = keys.url;
    }

    if (keys.apiKey && keys.url)  {	  	
      restIssues(keys.url, keys.apiKey, keys.id);

      document.getElementById("btn_issues").click();
    } else {
      document.getElementById("btn_settings").click();
    }
  });
}

function openTab(e) {
  var tabContent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none";
  }

   var tabLinks = document.getElementsByClassName("tablinks");
   for (i = 0; i < tabLinks.length; i++) {
     tabLinks[i].className = tabLinks[i].className.replace(" active", "");
   }

  var curTab = (e.currentTarget.id === "btn_settings") ? "settings" : "issues";
  document.getElementById(curTab).style.display = "block";
  e.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', function() {  
  document.getElementById("btn_settings").addEventListener("click", openTab);  
  document.getElementById("btn_issues").addEventListener("click", openTab);  

  load();  

  document.getElementById("btn_save_settings").addEventListener("click", function() {  
    var apiKey = document.getElementById("inp_api_key").value;
    var url = document.getElementById("inp_url").value;


    browser.storage.sync.set({ 
      apiKey : apiKey,
      url    : url
    }, function(){      
      restCurrentUser(url, apiKey);  
    });
  });

});
