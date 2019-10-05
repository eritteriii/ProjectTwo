var $roomName = $("#room-name");
var $campaignDescription = $("#campaign-description");
var $dmName = $("#dm-name");
var $playerList = $("#player-list");
var $waitingForPlayers = $("#waiting-for-players");
var $monsterDropdown = $("#monster-select");
var $monsterType = $("#monster-type");
var $createButton = $("#create-button");
var $addButton = $("#add-button");
var $dmTools = $("#dm-tools");
var loaded = false;

var room = {};

var urlParams = new URLSearchParams(window.location.search);
var isDm = false;
if (urlParams.has("is-dm")) {
  if (urlParams.get("is-dm")) {
    isDm = true;
  }
}
var roomId = null;
if (urlParams.has("room-id")) {
  roomId = urlParams.get("room-id");
}
var playerId = null;
if (urlParams.has("player-id")) {
  playerId = urlParams.get("player-id");
}
var characterId = null;
if (urlParams.has("character-id")) {
  characterId = urlParams.get("character-id");
}

if (roomId != null) {
  socket.emit("LoadRoom", roomId, function(loadedRoom) {
    console.log("Loaded Room", loadedRoom);
    room = loadedRoom;
    $roomName.text(room.name);
    $campaignDescription.text(room.description);
    $dmName.text("Hosted by " + room.host);
    RefreshPlayerList();
    getMonsters();
    if (!isDm) {
      $dmTools.hide();
    }
    loaded = true;
  });
} else {
  console.log("Loading Game room failed, handle elegantly");
}

socket.on("UpdateRoom", function(updatedRoom) {
  if (loaded && updatedRoom.room) {
    if (updatedRoom.room.id == roomId) {
      console.log("Received room update", updatedRoom.room);
      room = updatedRoom.room;
      RefreshPlayerList();
      console.log("Room updated");
    }
  }
});

socket.on("CloseRoom", function(id) {
  if (id == roomId) {
    console.log("DM left, closing the room");
    window.location.href = "/gameSelect";
  }
});

function RefreshPlayerList() {
  $playerList.empty();
  if (room.characters) {
    if (room.characters.length > 0) {
      console.log("Refreshing player list", room.characters);
      $waitingForPlayers.hide();
      for (var i = 0; i < room.characters.length; i++) {
        var status = "charIsAlive"
        if (room.characters[i].isDead){
          status = "charIsDead"
        }
        if (i == 0 && room.characters.length > 1) {
          $playerList.append(
              $(
                  '<div class="row">' +
                      '<div class="btn-group m-s-auto">' +
                          '<div id="player-' + room.characters[i].index +'">' +
                              '<button data-id="' + i + '" type="button" class="btn btn-dark namePlate1 ' + status + '" draggable="false">' + room.characters[i].name + ", Initiative:" + room.characters[i].initiative + '</button>' +
                          '</div>' +
                          '<div class="skullbtn">' +
                              '<button data-id="' + i + '" type="button" class="btn btn-success btn-circle end-turn">' +
                                  '<i class="fas fa-angle-double-right"></i>' +
                              '</button>' +
                          '</div>' +
                          '<div class="skullbtn">' +
                          '<button data-id="' + i +'" type="button" class="btn btn-dark btn-circle skull">' +
                              '<i class="fas fa-skull"></i>' +
                          '</button>' +
                      '</div>' +
                          '<div class="skullbtn">' +
                              '<button data-id="' + i + '" type="button" class="btn btn-danger btn-circle delete">' +
                                  '<i class="fas fa-trash-alt"></i>' +
                              '</button>' +
                          '</div>' +
                      '</div>' +
                  '</div>'
              )
          );
      } else {
          $playerList.append(
              $(
                  '<div class="row">' +
                      '<div class="btn-group m-s-auto">' +
                          '<div id="player-' + room.characters[i].index +'">' +
                              '<button data-id="' + i + '" type="button" class="btn btn-dark namePlate ' + status + '" draggable="false">' + room.characters[i].name + ", Initiative:" + room.characters[i].initiative + '</button>' +
                          '</div>' +
                          '<div class="skullbtn">' +
                              '<button data-id="' + i +'" type="button" class="btn btn-dark btn-circle skull">' +
                                  '<i class="fas fa-skull"></i>' +
                              '</button>' +
                          '</div>' +
                          '<div class="skullbtn">' +
                              '<button data-id="' + i + '" type="button" class="btn btn-danger btn-circle delete">' +
                                  '<i class="fas fa-trash-alt"></i>' +
                              '</button>' +
                          '</div>' +
                      '</div>' +
                  '</div>'
              )
          );
      }
      }
      $(".end-turn").each(function(index) {
        $(this).on("click", function() {
          var clickedCharacterIndex = $(this).data("id");
          var lastCharacterIndex = room.characters.length - 1;
          room.characters.move(clickedCharacterIndex, lastCharacterIndex);
          socket.emit("PlayerUpdate", {
            room: room
          });
        });
      });
      $(".skull").each(function(index) {
        $(this).on("click", function() {
          var clickedCharacterIndex = $(this).data("id");
          room.characters[clickedCharacterIndex].isDead = !room.characters[clickedCharacterIndex].isDead
          socket.emit("PlayerUpdate", {
            room: room
          });
          console.log(room.characters)
        })
      });
      $(".delete").each(function(index) {
        $(this).on("click", function() {
          var clickedCharacterIndex = $(this).data("id");
          socket.emit("PlayerLeft", {
            room: roomId,
            player: clickedCharacterIndex
          });
        });
      });
    } else {
      $waitingForPlayers.show();
    }
  } else {
    $waitingForPlayers.show();
  }
}

Array.prototype.swap = function(x, y) {
  var b = this[x];
  this[x] = this[y];
  this[y] = b;
  return this;
};
Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

// The API object contains methods for each kind of request we'll make
var API = {
  saveMonster: function(monster) {
    return $.ajax({
      headers: {
        "Content-Type": "application/json"
      },
      type: "POST",
      url: "api/monsters",
      data: JSON.stringify(monster)
    });
  },
  getMonsters: function() {
    return $.ajax({
      url: "api/monsters",
      type: "GET"
    });
  }
  // deleteExample: function(id) {
  //   return $.ajax({
  // 	url: "api/monsters/" + id,
  // 	type: "DELETE"
  //   });
  // }
};

var getMonsters = function() {
  API.getMonsters().then(function(monsters) {
    console.log(monsters);
    $monsterDropdown.empty();
    for (var i = 0; i < monsters.length; i++) {
      $monsterDropdown.append(
        $("<option></option>")
          .attr("value", monsters[i].Type)
          .text(monsters[i].Type)
      );
    }
  });
};

var saveMonster = function(event) {
  event.preventDefault();
  var monster = {
    Type: $monsterType.val().trim()
  };
  if (!monster.Type) {
    alert("You must enter a name for your monster.");
    return;
  }
  API.saveMonster(monster).then(function(res) {
    console.log("response", res);
    getMonsters();
  });
};

var addMonster = function() {
  var tempMonster = {
    room: roomId,
    name: $monsterDropdown.val().trim(),
    initiative: "DM",
    class: "monster"
  };
  room.characters.push(tempMonster);
  socket.emit("AddMonster", tempMonster, function(updatedRoom) {
    room = updatedRoom;
    socket.emit("PlayerUpdate", {
      room: room
    });
  });
  $monsterType.empty();
  console.log(tempMonster);
};

var el = document.getElementById("player-list");
var sortable = Sortable.create(el, {
  onUpdate: function(evt) {
    if (loaded) {
      room.characters.swap(evt.oldIndex, evt.newIndex);
      socket.emit("PlayerUpdate", {
        room: room
      });
    }
  }
});
$(window).bind("beforeunload", function() {
  if (isDm) {
    socket.emit("DMLeft", roomId);
  } else {
    socket.emit("PlayerLeft", {
      room: roomId,
      player: playerId
    });
  }
});
$createButton.on("click", saveMonster);
$addButton.on("click", addMonster);
