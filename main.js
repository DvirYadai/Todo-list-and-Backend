let savedToDoList = [];
let spanCounter = document.getElementById("counter");

window.addEventListener("DOMContentLoaded", () => {
  displayLoading();
  localStorage.removeItem("changeDataArr");
  if (localStorage.getItem("username")) {
    const username = localStorage.getItem("username");
    getFromServer(username);
  }
  setTimeout(() => hideLoading(), 500);
});

document.getElementById("login-button").addEventListener("click", (e) => {
  e.preventDefault();
  const username = document.getElementById("username");
  localStorage.setItem("username", username.value);
  getFromServer(username.value);
  username.value = "";
});

document.getElementById("qP").addEventListener("click", () => {
  document.getElementById("login-button").remove();
  const signInButton = document.createElement("input");
  signInButton.setAttribute("type", "submit");
  signInButton.setAttribute("id", "sign-in-button");
  signInButton.setAttribute("value", "Sign In");
  const form = document.getElementById("form");
  document.getElementById("qP").remove();
  form.appendChild(signInButton);

  signInButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = document.getElementById("username");
    createUser(username);
    username.value = "";
  });
});

// main events
document.getElementById("add-button").addEventListener("click", addingToDoTask);
document
  .getElementById("sort-button")
  .addEventListener("click", sortTheTasksByPriority);
document.getElementById("undo-button").addEventListener("click", undo);
document.getElementById("search-button").addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const searched = document.getElementById("search-button").value.trim();
    if (searched !== "") {
      let text = Array.from(document.querySelectorAll(".todo-text"));
      const re = new RegExp(searched, "g");
      for (let i = 0; i < text.length; i++) {
        text[i].innerHTML = text[i].innerHTML.replace(
          re,
          `<mark>${searched}</mark>`
        );
      }
    }
  }
  if (document.getElementById("search-button").value === "") {
    let text = Array.from(document.querySelectorAll(".todo-text"));
    for (let i = 0; i < text.length; i++) {
      text[i].innerHTML = text[i].innerHTML.replace(
        /(<mark[^>]*>|<\/mark>)/g,
        ""
      );
    }
  }
});

function getFromServer(username) {
  displayLoading();
  fetch(`http://localhost:3000/${username}`).then(
    (res) =>
      res
        .json()
        .then((data) => {
          const form = document.getElementById("form");
          form.remove();
          savedToDoList = data["my-todo"];
          addingTasksWhenLogin(savedToDoList);
          hideLoading();
        })
        .catch(() => {
          const usernameInput = document.getElementById("username");
          usernameInput.setAttribute("placeholder", `${res.statusText}`);
          hideLoading();
        }),
    () => {
      const toDoListUL = document.getElementById("to-do-list");
      const listItem = document.createElement("li");
      toDoListUL.appendChild(listItem);
      listItem.innerHTML = `The server is down at this moment, Hang tight.`;
      hideLoading();
    }
  );
}

function updateServer(arr) {
  displayLoading();
  const username = localStorage.getItem("username");
  fetch(`http://localhost:3000/${username}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "my-todo": arr }),
  }).then(
    (res) => res.json().then(() => hideLoading()),
    () => {
      const errorDiv = document.createElement("div");
      errorDiv.innerHTML = `There is a problem in our servers, your changes didn't save.</br> Please refresh the page.`;
      errorDiv.setAttribute("class", "error");
      document.querySelector("body").appendChild(errorDiv);
      hideLoading();
    }
  );
}

function createUser(username) {
  fetch(`http://localhost:3000/${username.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).then((res) =>
    res
      .json()
      .then(() => {
        localStorage.removeItem("changeDataArr");
        localStorage.setItem("username", username.value);
        const form = document.getElementById("form");
        form.remove();
      })
      .catch(() => {
        const usernameInput = document.getElementById("username");
        usernameInput.setAttribute("placeholder", `${res.statusText}`);
      })
  );
}

// Function that create to do task item and appending it to the html.
function addingToDoTask() {
  const inputValue = document.getElementById("text-input");
  const inputPriority = document.getElementById("priority-selector");
  if (inputValue.value === "" || inputPriority.value === "") {
    alert("Please enter your task and priority");
    return;
  }
  let timeCreation = new Date();
  timeCreation =
    timeCreation.toISOString().split("T")[0] +
    " " +
    timeCreation.toTimeString().split(" ")[0];

  LiCreationAndAppendingToHTML(
    inputValue.value,
    inputPriority.value,
    timeCreation
  );

  // Calling a function to store the text, priority and time in the localStorage and in the JSONBIN.io.
  toDoTaskObjectCreationAndStorage(inputValue, inputPriority, timeCreation);

  // Cleaning the text input.
  inputValue.value = "";
}

// Function that create to do task object and store it in the localStorage and in the JSONBIN.io.
function toDoTaskObjectCreationAndStorage(text, priority, time) {
  // Creation of task object
  const taskObject = {
    priority: priority.value,
    date: time,
    text: text.value,
    isDone: false,
  };

  // Store the object in the localStorage
  let toDoListLocalStorage = JSON.parse(localStorage.getItem("my-todo"));
  if (toDoListLocalStorage === null) toDoListLocalStorage = [];
  toDoListLocalStorage.push(taskObject);
  localStorage.setItem("my-todo", JSON.stringify(toDoListLocalStorage));

  // Store the object in the JSONBIN.io
  savedToDoList.push(taskObject);
  updateServer(savedToDoList);

  // Changing the counter
  spanCounter.innerText = savedToDoList.length;
}

function addingTasksWhenLogin(arr) {
  const toDoListUL = document.getElementById("to-do-list");
  const signOutButton = document.createElement("button");
  signOutButton.setAttribute("id", "sign-out-button");
  signOutButton.innerText = "Sign Out";
  toDoListUL.appendChild(signOutButton);
  signOutButton.addEventListener("click", signOutEvent);

  for (const item of arr) {
    const listItem = document.createElement("li");
    const containerDiv = document.createElement("div");
    containerDiv.setAttribute("class", "todo-container");

    appendProperty(containerDiv, "todo-text", item.text);
    appendProperty(containerDiv, "todo-priority", item.priority);
    appendProperty(containerDiv, "todo-created-at", item.date);

    listItem.appendChild(containerDiv);
    toDoListUL.appendChild(listItem);

    // Creating the delete button
    deleteButtonCreation(containerDiv);

    // Creating the edit button
    editButtonCreation(containerDiv);

    // Creating the checkbox
    checkBoxCreation(containerDiv);

    // Checking if the task is already finished
    if (item.isDone === true) {
      listItem.setAttribute("class", "done");
      const checkbox = listItem.querySelector("#checkbox");
      checkbox.checked = true;
    }
  }

  // Changing the number of tasks in the html.
  spanCounter.innerText = arr.length;
}

// Function that create div and appending the div to his parent.
function appendProperty(divElement, className, innerText) {
  const propertyDiv = document.createElement("div");
  propertyDiv.setAttribute("class", className);
  propertyDiv.innerText = innerText;
  divElement.appendChild(propertyDiv);
}

// Function that creat li and appending it to the html
function LiCreationAndAppendingToHTML(inputValue, inputPriority, timeCreation) {
  const toDoListUL = document.getElementById("to-do-list");
  const listItem = document.createElement("li");
  const containerDiv = document.createElement("div");
  containerDiv.setAttribute("class", "todo-container");

  // Calling function that create div and appending the div to the containerDiv.
  appendProperty(containerDiv, "todo-text", inputValue);
  appendProperty(containerDiv, "todo-priority", inputPriority);
  appendProperty(containerDiv, "todo-created-at", timeCreation);

  listItem.appendChild(containerDiv);
  toDoListUL.appendChild(listItem);

  // Creating the delete button
  deleteButtonCreation(containerDiv);

  // Creating the edit button
  editButtonCreation(containerDiv);

  // Creating the checkbox
  checkBoxCreation(containerDiv);
}

function signOutEvent() {
  localStorage.removeItem("changeDataArr");
  localStorage.removeItem("username");
  const toDoListUL = document.getElementById("to-do-list");
  toDoListUL.innerHTML = "";
  const viewSection = document.getElementById("view-section");
  const form = document.createElement("form");
  form.setAttribute("id", "form");
  const usernameInput = document.createElement("input");
  usernameInput.setAttribute("id", "username");
  usernameInput.setAttribute("name", "username");
  usernameInput.setAttribute("placeholder", "Enter your username");
  form.appendChild(usernameInput);
  const loginButton = document.createElement("input");
  loginButton.setAttribute("type", "submit");
  loginButton.setAttribute("id", "login-button");
  loginButton.setAttribute("value", "Login");
  form.appendChild(loginButton);
  const qP = document.createElement("p");
  qP.setAttribute("id", "qP");
  qP.innerHTML = "Don't have an account?";
  form.appendChild(qP);
  viewSection.appendChild(form);
}

// Function that create the delete button, adding click event and updating the localStorage and the JSONBIN.io
function deleteButtonCreation(divParent) {
  const deleteButton = document.createElement("i");
  deleteButton.setAttribute("class", "fas fa-trash-alt");
  divParent.appendChild(deleteButton);

  // Add click event to the button
  deleteButton.addEventListener("click", () => {
    const textDiv = divParent.querySelector("div.todo-text");
    let index = 0;
    for (let i = 0; i < savedToDoList.length; i++) {
      if (savedToDoList[i].text === textDiv.innerText) index = i;
    }

    // Adding the data that was delete to the changeDataArr for the undo function.
    let changeDataArr = JSON.parse(localStorage.getItem("changeDataArr"));
    if (changeDataArr === null) changeDataArr = [];
    changeDataArr.push(savedToDoList[index]);
    localStorage.setItem("changeDataArr", JSON.stringify(changeDataArr));

    savedToDoList.splice(index, 1);
    deleteButton.parentElement.parentElement.remove();

    // Updating the number of tasks in the html.
    spanCounter.innerText = savedToDoList.length;

    // Updating the localStorage
    localStorage.setItem("my-todo", JSON.stringify(savedToDoList));

    // Updating the JSONBIN.io
    updateServer(savedToDoList);
  });
}

// Function that create the edit button, adding click events and updating the localStorage and the JSONBIN.io
function editButtonCreation(divParent) {
  const editButton = document.createElement("i");
  editButton.setAttribute("class", "fas fa-edit");
  divParent.appendChild(editButton);

  const checkButton = document.createElement("i");
  checkButton.setAttribute("class", "far fa-check-circle check-default");
  divParent.appendChild(checkButton);

  // Add click event to the button
  editButton.addEventListener("click", () => {
    const textDiv = divParent.querySelector("div.todo-text");
    const priorityDiv = divParent.querySelector("div.todo-priority");
    editButton.classList.add("edit-clicked");
    checkButton.classList.replace("check-default", "check-when-edit-clicked");

    textDiv.contentEditable = true;
    textDiv.classList.add("edit");
    textDiv.focus();
    priorityDiv.contentEditable = true;
    priorityDiv.classList.add("edit");
    let index = 0;
    for (let i = 0; i < savedToDoList.length; i++) {
      if (savedToDoList[i].text === textDiv.innerText) index = i;
    }

    // Adding the data that was edit to the changeDataArr for the undo function.
    let changeDataArr = JSON.parse(localStorage.getItem("changeDataArr"));
    if (changeDataArr === null) changeDataArr = [];
    changeDataArr.push({
      text: textDiv.innerText,
      priority: priorityDiv.innerText,
    });

    // Add click event to close the edit option.
    checkButton.addEventListener("click", () => {
      if (
        priorityDiv.innerText < 1 ||
        priorityDiv.innerText > 5 ||
        priorityDiv.innerText.match(/[a-z]/i)
      ) {
        alert("Priotity must be a number from 1 to 5");
        return;
      }
      textDiv.contentEditable = false;
      textDiv.classList.remove("edit");
      priorityDiv.contentEditable = false;
      priorityDiv.classList.remove("edit");
      editButton.classList.remove("edit-clicked");
      checkButton.classList.replace("check-when-edit-clicked", "check-default");

      // Adding more data to the changeDataArr for the undo function.
      changeDataArr[changeDataArr.length - 1].newText = textDiv.innerText;
      localStorage.setItem("changeDataArr", JSON.stringify(changeDataArr));

      // Update the innerText of the div in the localStorage and JSONBIN.io
      savedToDoList[index].text = textDiv.innerText;
      savedToDoList[index].priority = priorityDiv.innerText;
      localStorage.setItem("my-todo", JSON.stringify(savedToDoList));
      updateServer(savedToDoList);
    });
  });
}

// Function that add checkbox to the task
function checkBoxCreation(divParent) {
  const checkBox = document.createElement("input");
  checkBox.setAttribute("type", "checkbox");
  checkBox.setAttribute("id", "checkbox");
  divParent.appendChild(checkBox);

  checkBox.addEventListener("click", () => {
    if (checkBox.checked === true) {
      divParent.parentElement.setAttribute("class", "done");
      let text = divParent.querySelector(".todo-text");
      for (let i = 0; i < savedToDoList.length; i++) {
        if (text.innerText === savedToDoList[i].text) {
          savedToDoList[i].isDone = true;
        }
      }
    } else {
      divParent.parentElement.removeAttribute("class", "done");
      let text = divParent.querySelector(".todo-text");
      for (let i = 0; i < savedToDoList.length; i++) {
        if (text.innerText === savedToDoList[i].text) {
          savedToDoList[i].isDone = false;
        }
      }
    }
    updateServer(savedToDoList);
  });
}

// Function that sort array of object
function sortTheTasksByPriority() {
  let liArr = Array.from(document.querySelectorAll("li"));
  liArr.sort(function (a, b) {
    return (
      b.children[0].children[1].innerText - a.children[0].children[1].innerText
    );
  });
  const toDoListUL = document.getElementById("to-do-list");
  const signOutButton = document.createElement("button");
  signOutButton.setAttribute("id", "sign-out-button");
  signOutButton.innerText = "Sign Out";
  toDoListUL.innerHTML = "";
  toDoListUL.appendChild(signOutButton);
  signOutButton.addEventListener("click", signOutEvent);
  liArr.forEach((node) => toDoListUL.appendChild(node));
}

// Function that undo the last change
function undo() {
  // Getting the array with the saved changes.
  let changeDataArr = JSON.parse(localStorage.getItem("changeDataArr"));
  // Checking if the last change was delete or edit.
  if (changeDataArr[changeDataArr.length - 1].date) {
    // Creating new li, appending it with the deleted data and appending the li to the html.
    LiCreationAndAppendingToHTML(
      changeDataArr[changeDataArr.length - 1].text,
      changeDataArr[changeDataArr.length - 1].priority,
      changeDataArr[changeDataArr.length - 1].date
    );
    savedToDoList.push(changeDataArr[changeDataArr.length - 1]);
    spanCounter.innerText = savedToDoList.length;
  } else {
    // Checking in which li was the editing and revers the edit outcome.
    let index = 0;
    for (let i = 0; i < savedToDoList.length; i++) {
      if (
        savedToDoList[i].text ===
        changeDataArr[changeDataArr.length - 1].newText
      )
        index = i;
    }
    savedToDoList[index].text = changeDataArr[changeDataArr.length - 1].text;
    savedToDoList[index].priority =
      changeDataArr[changeDataArr.length - 1].priority;
    const textDiv = document.querySelector(
      `#to-do-list > li:nth-child(${index + 1}) > div > div.todo-text`
    );
    const priorityDiv = document.querySelector(
      `#to-do-list > li:nth-child(${index + 1}) > div > div.todo-priority`
    );
    textDiv.innerText = changeDataArr[changeDataArr.length - 1].text;
    priorityDiv.innerText = changeDataArr[changeDataArr.length - 1].priority;
  }
  // Updating the localStorage and JSONBIN.io with the undo changes and deleting the last change from the changeDataArr.
  localStorage.setItem("my-todo", JSON.stringify(savedToDoList));
  updateServer(savedToDoList);
  changeDataArr.splice(changeDataArr.length - 1, 1);
  localStorage.setItem("changeDataArr", JSON.stringify(changeDataArr));
}

// showing loading
function displayLoading() {
  const loader = document.querySelector("#loading");
  loader.classList.add("display");
}

// hiding loading
function hideLoading() {
  const loader = document.querySelector("#loading");
  loader.classList.remove("display");
}
