var $userName = $("#username-input");
var $initiativeNumber = $("#initiative-number");
var $gameRoom = $("#game-room");
var $joinButton = $("#join-button");

socket.on("GetRooms", function (data) {
  for (var i = 0; i < data.rooms.length; i++) {
    $gameRoom.append($("<option></option>").attr("value", i).text(data.rooms[i].name));
  }
});

var JoinRoom = function (event) {
  event.preventDefault();

  var newPlayer = {
    room: $gameRoom.val().trim(),
    name: $userName.val().trim(),
    initiative: $initiativeNumber.val().trim(),
    class: 0 // TODO: add class to form and connect to DB
  };

  var tempPlayerIndex = null;
  socket.emit("JoinGame", newPlayer, function(playerIndex, characterIndex){
    tempPlayerIndex = playerIndex;
    if (tempPlayerIndex != null) {
      window.location.href = "/gameLobby?room-id=" + newPlayer.room +"&player-id=" + playerIndex + "&character-id=" + characterIndex;
    } else {
      console.log("game join likely failed, handle elegantly");
    }
  });
};

$joinButton.on("click", JoinRoom);
