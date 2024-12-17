// connecting backend server to socket.io
const socket = io.connect();

const userLists = document.getElementById("user-list");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const userList = document.getElementById("user-list");
const userNotification = document.getElementById("user-notification");
const currentChatUser = document.getElementById("current-chat-user");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const messageContainer = document.getElementById("messages-container");
const typingStatus = document.getElementById("typingStatus");
const logoutBtn = document.getElementById("logout-btn");

let activeChatterUpUser = JSON.parse(
  localStorage.getItem("activeChatterUpUser")
);
let activeChatUser = JSON.parse(localStorage.getItem("activeChatUser"));
let userElement = "";
let typingTimer;

// registering user on chatterUp
if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Access individual fields
    // const name = formData.get("name");
    // const email = formData.get("email");
    // const avatar = formData.get("avatar");
    // const password = formData.get("password");

    try {
      const response = await fetch("/api/user/signup", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
        throw new Error(errorData.error || "Unknown error occurred");
      }

      const result = await response.json();

      if (result.success) {
        getAllUserDeatails();

        // emit event after successful registration and sending all user details who registered on chatterUp
        socket.emit("newUserJoined", result.user);
        form.reset();
        window.location.href = "login.html";
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// user login to chatterUp
if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const loginData = {
      email: email,
      password: password,
    };
    try {
      const response = await fetch("/api/user/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Add content type header
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
        throw new Error(errorData.error || "Unknown error occurred");
      }

      const result = await response.json();

      if (result.success) {
        window.location.href = "chat.html";
        // sets active chatterUp user on localStorage to get on refresh or again visiting page
        localStorage.setItem(
          "activeChatterUpUser",
          JSON.stringify(result.user)
        );
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// call this function on every page visit or on refreshing page
getAllUserDeatails();

async function getAllUserDeatails() {
  // loading previous active chat user and active chatterUp user on refresh or again visiting page
  activeChatterUpUser = localStorage.getItem("activeChatterUpUser");
  activeChatUser = localStorage.getItem("activeChatUser");

  // parse string to object after getting from localStorage
  activeChatterUpUser = JSON.parse(activeChatterUpUser);
  activeChatUser = JSON.parse(activeChatUser);

  try {
    const response = await fetch("/api/user/get-all-details");

    const result = await response.json();

    if (result.success) {
      // emit event on successful fecthing users and send to server
      socket.emit("loadUsers", {
        users: result.users,
        activeChatterUpUser: activeChatterUpUser,
      });
    }
  } catch (err) {
    console.log(err);
  }
}

// check if it is chat.html or not
if (!registerForm && !loginForm) {
  // check if user is login or not

  if (
    !activeChatterUpUser ||
    activeChatterUpUser === "null" ||
    activeChatterUpUser === "undefined"
  ) {
    window.location.href = "login.html";
  }
}

// On joining new user it will send notification to all chatterUp users
socket.on("newJoinedUser", (message) => {
  userNotification.innerText = message;
  userNotification.style.display = "block";

  setTimeout(() => {
    userNotification.style.display = "none";
    userNotification.innerText = "";
  }, 3000);
});

// render all users after getting all chatterUp registered users
socket.on("users", (users) => {
  userList.innerHTML = ""; // Clear the user list

  users.forEach((user) => {
    if (user._id != activeChatterUpUser._id) {
      const li = document.createElement("li");
      li.className = "user";
      li.dataset.username = user.name; // Set the data-username attribute to get specific user

      li.innerHTML = `<img class="userImg" src="/uploads/${user.avatar}?${
        user.avatar
      }: profile.webp" alt="${user.name.split(" ")[0]}'s img" width="30" />
      <span>${user.name}</span>
      <span class="notification-badge"></span>`;

      li.addEventListener("click", () => startChatting(user)); // Add event listener
      userList.appendChild(li);

      // when page refreshed or we revisit, it will render notification badge of unread messages
      getUnreadMessage(user);
    }
  });

  // when page refreshed or we revisit, it will select the previous active user
  if (activeChatUser) {
    startChatting(activeChatUser);
  }
});

// on loading document it will render active chatterUp user image and name
document.addEventListener("DOMContentLoaded", () => {
  const chatterUpUser = document.getElementById("chatterUpUser");
  const userImg = document.getElementById("userImg");
  const username = document.getElementById("username");
  if (userImg && activeChatterUpUser) {
    userImg.src = activeChatterUpUser.avatar
      ? `uploads/${activeChatterUpUser.avatar}`
      : "uploads/profile.webp";

    if (username) {
      username.innerText = activeChatterUpUser.name;
    }

    chatterUpUser.style.visibility = "visible";
  }
});

// it select active chat user and render its previous chat
function startChatting(user) {
  // Remove "active" from any existing active user
  const activeElement = document.querySelector(".user.active");
  if (activeElement) {
    activeElement.classList.remove("active");
    messageContainer.innerHTML = "";
  }

  // Add "active" to the selected user
  const newUserElement = document.querySelector(
    `[data-username="${user.name}"]`
  );

  if (newUserElement) {
    newUserElement.classList.add("active");
  }

  // set active chat user on localStorage for further uses
  localStorage.setItem("activeChatUser", JSON.stringify(user));

  // Set active chat user instantly istead of getting again from localStorage
  activeChatUser = user;

  if (currentChatUser) {
    currentChatUser.innerText = user.name;
    currentChatUser.style.visibility = "visible";
  }

  // load and render previous chat on refreshing or revisiting page
  loadPreviousChat();
}

// show typing notification to reciever
if (messageInput) {
  messageInput.addEventListener("input", () => {
    if (!activeChatUser) {
      return;
    }

    // clear timeout which is sets when we pressed letter earlier
    clearTimeout(typingTimer);

    // emit event to send  typing message to specific user
    socket.emit("typing", {
      roomId: activeChatUser._id,
      userId: JSON.parse(localStorage.getItem("activeChatterUpUser"))._id,
    });

    // set typing timeout for 2 second
    typingTimer = setTimeout(() => {
      socket.emit("stopTyping", {
        roomId: activeChatUser._id,
        userId: activeChatterUpUser._id,
      });
    }, 2000);
  });
}

// Listen on typing
socket.on("typing", (userId) => {
  if (activeChatUser._id == userId.userId) {
    typingStatus.style.visibility = "visible";
  }
});

// Listen on stop typing
socket.on("stopTyping", (userId) => {
  if (activeChatUser._id == userId.userId) {
    typingStatus.style.visibility = "hidden";
  }
});

// send messages to the user
if (sendBtn) {
  sendBtn.addEventListener("click", () => {
    if (!activeChatUser || !messageInput.value.trim()) {
      return;
    }

    let time = new Date();

    renderSendMessage(messageInput.value, time);

    const message = {
      message: messageInput.value,
      reciever: activeChatUser,
      sender: activeChatterUpUser,
      time: time,
    };

    // emit event when new message send
    socket.emit("newMessage", message);

    messageInput.value = "";
  });
}

// render new message
socket.on("message", ({ message, sender, time }) => {
  if (activeChatUser._id == sender._id) {
    renderRecievedMessage(sender.name, message, time);
  }
});

// update unread messages count of notification badge
socket.on("update-unread-count", ({ count, sender }) => {
  // if both user are actively chatting than we have not to show unread message notification badge
  if (activeChatUser._id == sender._id) {
    const notificationBadge = document.querySelector(
      `.user[data-username = "${sender.name}"] .notification-badge`
    );
    if (notificationBadge) {
      notificationBadge.innerText = "";
      notificationBadge.style.visibility = "hidden";
    }

    // emit event to update message as read
    socket.emit("mark-as-read", {
      sender: activeChatUser,
      reciever: activeChatterUpUser,
    });

    return;
  }

  // if one user is not active in chat section than show unread notificaton badge
  const notificationBadge = document.querySelector(
    `.user[data-username = "${sender.name}"] .notification-badge`
  );

  // Remove the badge if it exists
  if (notificationBadge) {
    notificationBadge.innerText = "";
    notificationBadge.style.visibility = "hidden";
  }

  if (count) {
    // get spicfic user using this selecting method
    const userElement = document.querySelector(
      `.user[data-username = "${sender.name}"] .notification-badge`
    );

    if (userElement) {
      userElement.innerText = count;
      userElement.style.visibility = "visible";
    }
  }
});

// get unread message of active chatterUp user and render notification badge to user which is passed in argument
async function getUnreadMessage(user) {
  try {
    const response = await fetch(
      `/api/message/getUnreadMessageCount/${user._id.toString()}/${activeChatterUpUser._id.toString()}`
    );

    const result = await response.json();

    if (result.success) {
      if (result.unreadMessageCount) {
        const userElement = document.querySelector(
          `.user[data-username = "${user.name}"] .notification-badge`
        );

        if (userElement) {
          userElement.innerText = result.unreadMessageCount;
          userElement.style.visibility = "visible";
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}

// get previous to render on page refresh or revisiting page
async function loadPreviousChat() {
  try {
    const response = await fetch(
      `/api/message/getUserMessage/${activeChatterUpUser._id}/${activeChatUser._id}`
    );

    const result = await response.json();

    if (result.success) {
      messageContainer.innerHTML = "";

      // after loading messages mark it as read
      socket.emit("mark-as-read", {
        sender: activeChatUser,
        reciever: activeChatterUpUser,
      });

      result.message.forEach((message) => {
        if (message.sender == activeChatterUpUser._id) {
          renderSendMessage(message.content, message.createdAt);
        } else {
          renderRecievedMessage(
            activeChatUser.name,
            message.content,
            message.createdAt
          );
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
}

// render send message
function renderSendMessage(message, time) {
  const div = document.createElement("div");
  div.classList.add("message", "sent");
  const span = document.createElement("span");
  span.classList.add("user");
  span.innerText = "you : ";
  div.appendChild(span);
  const messageText = document.createTextNode(message);
  div.appendChild(messageText);
  const para = document.createElement("p");
  para.classList.add("sendtime");
  para.innerText = new Date(time).toLocaleString();
  div.appendChild(para);

  messageContainer.appendChild(div);
}

// render to recieve message
function renderRecievedMessage(username, message, time) {
  const div = document.createElement("div");
  div.classList.add("message", "received");
  const span = document.createElement("span");
  span.classList.add("user");
  span.innerText = `${username.split(" ")[0]} : `;
  div.appendChild(span);
  const messageText = document.createTextNode(message);
  div.appendChild(messageText);
  const para = document.createElement("p");
  para.classList.add("recievedtime");
  para.innerText = new Date(time).toLocaleString();
  div.appendChild(para);

  messageContainer.appendChild(div);
}

// Logout from chatterUp
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (activeChatterUpUser) {
      const response = await fetch("/api/user/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem("activeChatterUpUser");
        window.location.href = "login.html";
      }
    }
  });
}
