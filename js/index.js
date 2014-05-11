if (!localStorage.num) localStorage.num = 0; 
if (!localStorage.select) localStorage.select = 0;
if (!localStorage.List) localStorage.List = "";

// localStorage.num = 0;
// localStorage.select = 0;
// localStorage.List  = '{"recordList":[]}';

function sendToDo(event) {
  if (event.keyCode != 13) return;
  var todo = document.getElementById("todo-input").value;
  if (todo == "") return;
  var newList = document.createElement("li");
  var viewBlock = document.createElement("div");
  viewBlock.className = "view";
  var newBox = document.createElement("input");
  newBox.className = "tick";
  newBox.type = "checkbox";
  newBox.addEventListener("click", tick, false);
  var newlable = document.createElement("lable");
  newlable.innerHTML = todo;
  newlable.ondblclick = editer;
  var newcross = document.createElement("a");
  newcross.className = "destroy";
  newcross.addEventListener("click", deleteBlock, false);
  viewBlock.appendChild(newBox);
  viewBlock.appendChild(newlable);
  viewBlock.appendChild(newcross);
  var edit = document.createElement("input");
  edit.type = "text";
  edit.className = "edit";
  newList.appendChild(viewBlock);
  edit.value = todo;
  newList.appendChild(edit);
  document.getElementById("todo-list").appendChild(newList);
  localStorage.num++;
  if (localStorage.num != 0) document.getElementById("main").style.display = "block";
  if (localStorage.num != 0) document.getElementsByTagName("footer")[0].style.display = "block";
  document.getElementById("todo-input").value = "";
  var left = document.createTextNode;
  left.innerHTML = (localStorage.num - localStorage.select) + " items left";
  // if (document.getElementById("clear-completed")) document.getElementById("clear-completed").innerHTML = "clear " + num + " completed items";
  var footer = document.getElementsByTagName("footer")[0];
  if (footer.childNodes.length == 0) {
    var show = document.createElement("div");
    show.className = "todo-count";
    show.innerHTML = left.innerHTML;
    footer.appendChild(show);
  } else {
      document.getElementsByClassName("todo-count")[0].innerHTML = left.innerHTML;
  }
  save();
}

function chooseAll() {
  var box = document.getElementsByClassName("tick");
  for (var i in box) {
    box[i].checked = document.getElementById("select-all").checked;
  }
  if (document.getElementById("select-all").checked == 1) localStorage.select = localStorage.num;
  else localStorage.select = 0;
  check();
}

function deleteBlock(event) {
  var block = event.currentTarget.parentNode.parentNode;
  block.parentNode.removeChild(block);
  localStorage.num--;
  if (event.currentTarget.parentNode.firstChild.checked == 1) localStorage.select--;
  check();
  document.getElementsByClassName("todo-count")[0].innerHTML = localStorage.num - localStorage.select + " items left";
  save();
}

function deleteAll() {
  var list = document.getElementById("todo-list");
  while (list.childNodes.length != 0) {
    list.removeChild(list.lastChild);
  }
  localStorage.num = 0;
  localStorage.select = 0;
  document.getElementById("select-all").checked = 0;
  check();
  save();
}

function tick(event) {
  if (event.currentTarget.checked == 1) {
    localStorage.select++;
    check();
  } else {
      localStorage.select--;
      check();
  }
}

function check() {
  if ((localStorage.select == 0) && (document.getElementById("clear-completed"))) {
    var p = document.getElementById("clear-completed");
    p.parentNode.removeChild(p);
  }
  if ((localStorage.select != 0) && (!document.getElementById("clear-completed"))) {
    var clear = document.createElement("a");
    clear.id = "clear-completed";
    clear.innerHTML = "Clear " + localStorage.select + " completed items";
    document.getElementsByTagName("footer")[0].appendChild(clear);
    clear.addEventListener("click", deleteAll, false);
    document.getElementsByClassName("todo-count")[0].innerHTML = localStorage.num - localStorage.select + " items left";
  }
  if (document.getElementById("clear-completed"))
    document.getElementById("clear-completed").innerHTML = "Clear " + localStorage.select + " completed items";
  document.getElementsByClassName("todo-count")[0].innerHTML = localStorage.num - localStorage.select + " items left";
  if (localStorage.num == 0) {
    document.getElementById("main").style.display = "none";
    document.getElementsByTagName("footer")[0].style.display = "none";
  }
}

function editer(event) {
  var block = event.currentTarget.parentNode.parentNode;
  block.lastChild.style.display = "block";
  block.addEventListener("keypress", change, false);
  block.addEventListener("blur", change, false);
  block.lastChild.focus();
  event.currentTarget.parentNode.style.display = "none";
}

function change(event) {
  if (event.keyCode != 13) return;
  var block = event.currentTarget.getElementsByClassName("edit")[0];
  var view = block.parentNode.getElementsByClassName("view")[0];
  view.getElementsByTagName("lable")[0].innerHTML = block.value;
  view.style.display = "block";
  block.style.display = "none";
  save();
}

function save() {
  function record() {
    this.recordList = [];
  }
  var newRecord = new record();
  var todoList = document.getElementsByTagName("lable");
  for (var i in todoList) {
    var text = todoList[i].innerHTML;
    var node = {"node" : text};
    if (text != "") newRecord.recordList.push(node);
  }
  localStorage.List = JSON.stringify(newRecord);
}

function load() {
  if (localStorage.num != 0) document.getElementById("main").style.display = "block";
  if (localStorage.num != 0) document.getElementsByTagName("footer")[0].style.display = "block";
  var obj = eval("(" + localStorage.List + ")");
  for (var i in obj.recordList) {
    if (!obj.recordList[i].node) continue;
    var newList = document.createElement("li");
    var viewBlock = document.createElement("div");
    viewBlock.className = "view";
    var newBox = document.createElement("input");
    newBox.className = "tick";
    newBox.type = "checkbox";
    newBox.addEventListener("click", tick, false);
    var newlable = document.createElement("lable");
    newlable.innerHTML = obj.recordList[i].node;
    newlable.ondblclick = editer;
    var newcross = document.createElement("a");
    newcross.className = "destroy";
    newcross.addEventListener("click", deleteBlock, false);
    viewBlock.appendChild(newBox);
    viewBlock.appendChild(newlable);
    viewBlock.appendChild(newcross);
    var edit = document.createElement("input");
    edit.type = "text";
    edit.className = "edit";
    newList.appendChild(viewBlock);
    edit.value = obj.recordList[i].node;
    newList.appendChild(edit);
    document.getElementById("todo-list").appendChild(newList);
    var left = document.createTextNode;
    left.innerHTML = (localStorage.num - localStorage.select) + " items left";
    // if (document.getElementById("clear-completed")) document.getElementById("clear-completed").innerHTML = "clear " + num + " completed items";
    var footer = document.getElementsByTagName("footer")[0];
    if (footer.childNodes.length == 0) {
      var show = document.createElement("div");
      show.className = "todo-count";
      show.innerHTML = left.innerHTML;
      footer.appendChild(show);
    } else {
        document.getElementsByClassName("todo-count")[0].innerHTML = left.innerHTML;
    }
  }
}

var todoInput = document.getElementById("todo-input");
todoInput.addEventListener("keypress", sendToDo, false);
document.getElementById("select-all").addEventListener("click", chooseAll, false);

window.onload = load();