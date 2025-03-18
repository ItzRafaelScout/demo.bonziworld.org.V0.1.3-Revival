const fs = require("fs");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const crypto = require("crypto");
const commands = require("./commands.js");
let uptime = 0;
setInterval(()=>{
    uptime++;
    Object.keys(rooms).forEach(room=>{
        rooms[room].reg++;
        Object.keys(rooms[room].users).forEach(user=>{
            rooms[room].users[user].public.joined++;
            //rooms[room].emit("update", room[room].users[user].public)
        })
    })
}, 60000)

const config = commands.config;
const colors = commands.colors;
const app = new express();

app.use(express.static("client"));
const server = http.Server(app);
const io = socketio(server);
server.listen(config.port);

io.on("connection", (socket)=>{
  new user(socket);
})

console.log("Server running at: http://bonzi.localhost:"+config.port)

function guidgen(){
	let guid = Math.round(Math.random() * 999999998+1).toString();
	while(guid.length < 9) guid = "0"+guid;
	//Vaildate
	users = []
	Object.keys(rooms).forEach((room)=>{
		users.concat(Object.keys(rooms[room].users));
	})
	while(users.find(e=>{return e.public.guid == guid}) != undefined){
		let guid = Math.round(Math.random() * 999999999).toString();
		while(guid.length < 9) guid = "0"+guid;
	}
	return guid;
}

class room{
	constructor(name, owner, priv){
		this.name = name;
		this.users = {};
		this.usersPublic = {};
		this.ownerID = owner;
		this.private = priv;
    this.reg = 0;
    this.msgsSent = 0;
    this.cmdsSent = 0;
    this.loginCount = 0;
	}
	emit(event, content){
		Object.keys(this.users).forEach(user=>{
			this.users[user].socket.emit(event, content);
		})
	}
}

const rooms = {
	default: new room("default", 0, false),
	desanitize: new room("desanitize", 0, false),
}
commands.rooms = rooms;

class user{
	constructor(socket){
		this.socket = socket;
		this.loggedin = false;
		this.level = 0;
		this.sanitize = "true";
    this.owner = 0;

    this.socket.on("login", logindata=>{
			this.login(logindata);
		})
	}

  login(logindata){
		if(this.loggedin) return;
    if(logindata.room == "desanitize") this.sanitize = false;
		logindata.name =  sanitize(logindata.name);
    this.loggedin = true;
	  if(logindata.room.replace(/ /g,"") == "") logindata.room = "default";
	  if(logindata.name.rtext.replace(/ /g,"") == "") logindata.name = sanitize(config.defname);
    this.public = {
      guid: guidgen(),
			name: logindata.name.rtext,
      voice: {
				pitch: 15+Math.round(Math.random()*110),
				speed: 125+Math.round(Math.random()*150),
				wordgap: 0
			},
      color: (colors.includes(logindata.color)) ? logindata.color : colors[Math.floor(Math.random()*colors.length)],
      joined: 0
   }
   if(rooms[logindata.room] == undefined){
			rooms[logindata.room] = new room(logindata.room, this.public.guid, true);
			this.level = 1;
	 }
   rooms[logindata.room].emit("join", this.public);
	 this.room = rooms[logindata.room];
	 this.room.usersPublic[this.public.guid] = this.public;
	 this.room.users[this.public.guid] = this;
   this.socket.emit("login", {
			e7qqM5aje7qqM5ajroomname: logindata.room,
			roompriv: this.room.private,
      owner: this.public.guid == this.room.ownerID,
			users: this.room.usersPublic,
			level: this.level
		})

		this.room.loginCount++;

		this.socket.on("talk", (text)=>{
			if(typeof text != 'string' || sanitize(text).rtext.replace(/ /g, "") == '' && this.sanitize) return;
			text = this.sanitize ? sanitize(text.replace(/{NAME}/g, this.public.name).replace(/{COLOR}/g, this.public.color)) : text;
			if(text.length > config.maxmessage && this.sanitize) return;
			text = text.trim();
			this.room.emit("talk", {text: text.mtext, say: text.rtext, guid: this.public.guid})
		})

		this.socket.on("command", comd=>{
				if(typeof comd != 'object') return;
				if(typeof comd.param != 'string') comd.param = "";
				if(typeof(commands.commands[comd.command]) != 'function') return;
				commands.commands[comd.command](this, this.sanitize ? sanitize(comd.param) : comd.param); 
		})

		this.socket.on("disconnect", ()=>{
			this.room.emit("leave", this.public.guid);
				delete this.room.usersPublic[this.public.guid];
				delete this.room.users[this.public.guid];
				if(Object.keys(this.room.private) )delete rooms[this.room.name];

				else if(this.room.ownerID == this.public.guid){
					this.room.ownerID = this.room.usersPublic[Object.keys(this.room.usersPublic)[0]].guid;
					this.room.users[this.room.ownerID].level = 1;
					this.room.users[this.room.ownerID].socket.emit("update_self", {
						level: this.room.users[this.room.ownerID].level,
						roomowner: true
					})
				}
		})
	}
}

function sanitize(text){
	//Return undefined if no param. Return sanitized if param exists.
	if(text == undefined) return undefined;
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/\[/g, "&lbrack;");
}

function desanitize(text){
	return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&lbrack;/g, "[");
}
                   
