var bkg = chrome.extension.getBackgroundPage();
var url = "http://redmine.redspell.ru/my/page";
var rootUrl = "http://redmine.redspell.ru/";
var req;

function handleStateChange() {
}

function handleError() {
}

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

function handleResponse() {
  var html = new DOMParser().parseFromString(req.responseText, "text/html");

  var loginForm = html.getElementById('login-form');
  if (loginForm) {
    
    var div = document.createElement('div');
    div.className = "div_auth";
    div.innerHTML = '<a href="' + rootUrl + '">RedSpell HQ</a>';
    document.getElementsByTagName('body')[0].appendChild(div);

    alinkInit();

  } else {

    var myPage = html.getElementById('my-page');
    var elems = myPage.getElementsByTagName("tr");
  
    var table = document.createElement('table');
    table.id = 'tickets';
  
    for (i in elems) {
      var el = elems[i];
  
      if (el.id && el.id.startsWith("issue-")) {
        var row = table.insertRow()
        row.className = i % 2 == 0 ? "even" : "odd";
  
        var id = el.getElementsByClassName("id")[0].firstElementChild;
        id.setAttribute('href', rootUrl + id.getAttribute("href"));
        row.insertCell(0).innerHTML = el.getElementsByClassName("id")[0].innerHTML;
  
        var project = el.getElementsByClassName("project")[0].firstElementChild;
        project.setAttribute('href', rootUrl + project.getAttribute("href"));
        row.insertCell(1).innerHTML = el.getElementsByClassName("project")[0].innerHTML;
        
        row.insertCell(2).innerHTML = el.getElementsByClassName("status")[0].innerHTML;
        
        var subject = el.getElementsByClassName("subject")[0].firstElementChild;
        subject.setAttribute('href', rootUrl + subject.getAttribute("href"));
        row.insertCell(3).innerHTML = el.getElementsByClassName("subject")[0].innerHTML;
      }      
    }
  
    var header = table.createTHead();
    var row = header.insertRow(0);  
    row.insertCell(0).innerText = "#";  
    row.insertCell(1).innerText = "Проект";  
    row.insertCell(2).innerText = "Статус";  
    row.insertCell(3).innerText = "Тема";  

    document.getElementsByTagName('body')[0].appendChild(table);
  
    alinkInit();
  }
}

function main() {
  //bkg.console.log("main");

  req = new XMLHttpRequest();
  req.onload = handleResponse;
  req.onerror = handleError;
  req.onreadystatechange = handleStateChange;
  req.open("GET", "http://redmine.redspell.ru/my/page", true);
  req.send(null);
}

document.addEventListener('DOMContentLoaded', function() {
  main();

  document.getElementById('clickme').addEventListener('click', function() {  
  });
});
