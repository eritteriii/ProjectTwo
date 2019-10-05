"use strict";
var express = require("express");
var socketIO = require("socket.io");
var exphbs = require("express-handlebars");
var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express()
	.engine("handlebars", exphbs())
	.use(express.urlencoded({extended: false}))
	.use(express.json())
	.use(express.static("public"))
	.set("port", PORT)
	.set("view engine", "handlebars")
	.get("/", function (req, res) {
		res.render("userSelect");
	})
	.get("/gameCreate", function (req, res) {
		res.render("gameCreate");
	})
	.get("/gameSelect", function (req, res) {
		res.render("gameSelect");
	})
	.get("/gameLobby", function (req, res) {
		res.render("gameLobby");
	})
	.get("/api/monsters", function (req, res) {
		db.MonsterTable.findAll({}).then(function (dbTable) {
			res.json(dbTable);
		});
	})
	.post("/api/monsters", function (req, res) {
		db.MonsterTable.create(req.body).then(function (dbTable) {
			res.json(dbTable);
		});
	})
	// .delete("/api/monsters/:id", function (req, res) {
	// 	db.MonsterTable.destroy({where: {id: req.params.id}}).then(function (dbTable) {
	// 		res.json(dbTable);
	// 	});
	// })
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

var syncOptions = {force: false};
if (process.env.NODE_ENV === "test") {
	syncOptions.force = true;
}
db.sequelize.sync(syncOptions).then(function () {
});

var rooms = [];

var io = socketIO(app);
io.on("connection", function (socket) {
	console.log("made socket connection");
	socket.emit("GetRooms", {
		rooms: rooms
	});
	
	socket.on("NewGame", function (newRoom, callback) {
		var newGameIndex = 0;
		if (rooms.length > 0) {
			newGameIndex = rooms.length;
		}
		var tempRoom = {
			name: newRoom.name,
			id: newGameIndex,
			description: newRoom.description,
			host: newRoom.host,
			characters: []
		};
		rooms.push(tempRoom);
		console.log("New Game started: " + tempRoom.name + " | " + tempRoom.description + " | " + tempRoom.host);
		callback(newGameIndex);
	});
	
	socket.on("JoinGame", function (newPlayer, callback) {
		var newCharacterIndex = 0;
		if (rooms[newPlayer.room].characters.length > 0) {
			newCharacterIndex = rooms[newPlayer.room].characters.length;
		}
		newPlayer.index = newCharacterIndex;
		newPlayer.type = "player";
		newPlayer.isDead = false
		rooms[newPlayer.room].characters.push(newPlayer);
		console.log("New Player added to room '" + rooms[newPlayer.room].name + "': " + newPlayer.name + " | " + newPlayer.initiative);
		callback(newCharacterIndex);
	});
	
	socket.on("AddMonster", function (newMonster, callback) {
		var newCharacterIndex = 0;
		if (rooms[newMonster.room].characters.length > 0) {
			newCharacterIndex = rooms[newMonster.room].characters.length;
		}
		newMonster.index = newCharacterIndex;
		rooms[newMonster.room].characters.push(newMonster);
		console.log("New Monster added to room '" + rooms[newMonster.room].name + "': " + newMonster.name);
		callback(rooms[newMonster.room]);
	});
	
	socket.on("LoadRoom", function (roomId, callback) {
		io.emit("UpdateRoom", {
			room: rooms[roomId]
		});
		callback(rooms[roomId]);
	});
	
	socket.on("PlayerUpdate", function (updatedRoom) {
		rooms[updatedRoom.id] = updatedRoom;
		io.emit("UpdateRoom", rooms[updatedRoom.id]);
	});
	
	socket.on("DMLeft", function (index) {
		if (rooms[index]) {
			rooms.splice(index, 1);
			console.log("DM left, closing room " + index);
			io.emit("CloseRoom", index);
		}
	});
	
	socket.on("PlayerLeft", function (indexes) {
		if (rooms[indexes.room]) {
			rooms[indexes.room].characters.splice(indexes.player, 1);
			io.emit("UpdateRoom", {
				room: rooms[indexes.room]
			});
			console.log("Player " + indexes.player + " left room " + indexes.room);
		}
	});
});

setInterval(() => io.emit("time", new Date().toTimeString()), 1000);
module.exports = app;
