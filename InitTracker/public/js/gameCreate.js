// Get references to page elements
var $gameName = $("#game-name-input");
var $campaignDescription = $("#campaign-description-input");
var $hostedBy = $("#hosted-by-input");
var $createButton = $("#create-button");

var CreateRoom = function (event) {
	event.preventDefault();
	var newGame = {
		name: $gameName.val().trim(),
		description: $campaignDescription.val().trim(),
		host: $hostedBy.val().trim()
	};
	var tempGameIndex = null;
	socket.emit("NewGame", newGame, function(gameIndex){
		tempGameIndex = gameIndex
		if (tempGameIndex != null) {
			window.location.href = "/gameLobby?room-id=" + gameIndex +"&is-dm=true";
		} else {
			console.log("game creation likely failed, handle elegantly");
		}
	});
};

$createButton.on("click", CreateRoom);
