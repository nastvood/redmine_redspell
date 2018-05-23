var bkg = chrome.extension.getBackgroundPage();
var rootUrl = "http://redmine.redspell.ru/";

function alinkInit() {
  var links = document.getElementsByTagName("a");
  for (var i = 0; i < links.length; i++) {
    (function () {
      var ln = links[i];
      var location = ln.href;
      ln.onclick = function () {
        chrome.tabs.create({active: true, url: location});
      };
    })();
  }
};

function rest(path, key, args, handler) {
  var url = "http://redmine.redspell.ru/" + path + "?key=" + key + args; 
	bkg.console.log(url);

	var errHandler = function(e) {
		if (e.message == 401) {
			//alert("Не верный Key API");
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

function restIssues(apiKey, id) {
	rest("issues.json", apiKey, "&assigned_to_id=" + id + "&limit=100&sort=updated_on:desc", function restHandleResponse(resp) {

    var table = document.createElement('table');
    table.id = 'tickets';
    
    for (i in resp.issues) {
      var issue = resp.issues[i];

      var row = table.insertRow()
      row.className = i % 2 == 0 ? "even" : "odd";

      var id = document.createElement('a');
      id.setAttribute('href', rootUrl + "issues/" + issue.id);
	  	id.innerText = issue.id;			
      row.insertCell(0).appendChild(id);  
    
      var project = document.createElement('a');
      project.setAttribute('href', rootUrl + "projects/" + issue.project.id);
	  	project.innerText = issue.project.name;			
      row.insertCell(1).appendChild(project);  

      row.insertCell(2).innerHTML = issue.status.name;

      var subject = document.createElement('a');
      subject.setAttribute('href', rootUrl + "issues/" + issue.id);
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

    document.getElementById('div_tickets').appendChild(table);
    
    alinkInit();
	})
}

function restCurrentUser(apiKey) {
	rest("users/current.json", apiKey, "", function restHandleResponse(resp) {
		
		var user = resp.user;

    chrome.storage.sync.set({ 
    	apiKey : apiKey,
			id     : user.id,
			login  : user.login
	  }, function(){
		});

		restIssues(apiKey, user.id);

	})
}

function load() {
  chrome.storage.sync.get(function(keys){ 
		document.getElementById("inp_api_key").value = keys.apiKey;
		restIssues(keys.apiKey, keys.id);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  load();

  document.getElementById('btn_save_settings').addEventListener('click', function() {  
    var apiKey = document.getElementById("inp_api_key").value;
    chrome.storage.sync.set({ 
      apiKey : apiKey
    }, function(){      
      restCurrentUser(apiKey);  
    });
  });

});
