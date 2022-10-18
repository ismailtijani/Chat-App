const socket = io();

// Elements
const $message = document.querySelector("#input");
const $submit = document.querySelector("#submit");
const $shareLocationButton = document.querySelector("#share-location");
const $messageContainer = document.querySelector("#message-container");

// Templates
const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationTemplate =
  document.querySelector("#location-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//AutoScroll
const autoscroll = () => {
  //New message element
  const $newMessage = $messageContainer.lastElementChild;
  //Height of new Message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  //Visible Height
  const VisibleHeight = $messageContainer.offsetHeight;
  //Toatal height of message container
  const containerHeight = $messageContainer.scrollHeight;
  //How far i have scrolled
  const scrollOffset = $messageContainer.scrollTop + VisibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messageContainer.scrollTop = $messageContainer.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render($messageTemplate, {
    name: message.username,
    message: message.textMessage,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messageContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render($locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messageContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render($sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

$submit.addEventListener("click", (e) => {
  e.preventDefault();

  // Disable button
  $submit.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", $message.value, (response) => {
    // Reanable button
    $submit.removeAttribute("disabled");
    $message.value = "";
    $message.focus();
  });
});

$shareLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Geolocation is not supported by your browser");
  $shareLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude }, (response) => {
      $shareLocationButton.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
