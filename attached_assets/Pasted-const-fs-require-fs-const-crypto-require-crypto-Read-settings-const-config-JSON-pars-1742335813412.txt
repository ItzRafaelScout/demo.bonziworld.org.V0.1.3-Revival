const fs = require("fs");
const crypto = require("crypto");
//Read settings
const config = JSON.parse(fs.readFileSync("./config/server-settings.json"));
const jokes = JSON.parse(fs.readFileSync("./config/jokes.json"));
const facts = JSON.parse(fs.readFileSync("./config/facts.json"));

let ccc = fs.readFileSync("./config/colors.txt").toString().replace(/\r/g, "");
if(ccc.endsWith("\n")) ccc = ccc.substring(0, ccc.length-1);
const colors = ccc.split("\n");

module.exports.config = config;
module.exports.colors = colors;
module.exports.bancount = 0;
module.exports.rooms;
module.exports.commands = {
	color: (user, param)=>{
    param = param.replace(/ /g, "").replace(/"/g, "").replace(/'/g, "");
    param = param.toLowerCase();
		if(colors.includes(param)) user.public.color = param;
		else user.public.color = colors[Math.floor(Math.random() * colors.length)];
    user.room.emit("update", user.public);
  },

  name: (user, param)=>{
		if(param.rtext.replace(/ /g, "").length > 0){
			user.public.name = param.rtext;
			user.public.dispname = param.mtext;
			user.room.emit("update", user.public);
		}
	},

  asshole: (user, param)=>{
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{type: 0, text: "Hey, "+param+"!"}, {type: 0, text: "You're a fucking asshole!"}, {type: 1, anim: "grin_fwd"}, {type: 1, anim: "grin_back"}]
		})
	},
	joke: (user, param)=>{
		let joke = [];
		jokes.start[Math.floor(Math.random()*jokes.start.length)].forEach(jk=>{
			if(jk.type == 0) joke.push({type: 0, text: tags(jk.text, user)})
			else joke.push(jk);
		})
		joke.push({type: 1, anim: "shrug_fwd"});
		jokes.middle[Math.floor(Math.random()*jokes.middle.length)].forEach(jk=>{
			if(jk.type == 0) joke.push({type: 0, text: tags(jk.text, user)})
			else joke.push(jk);
		})
		jokes.end[Math.floor(Math.random()*jokes.end.length)].forEach(jk=>{
			if(jk.type == 0) joke.push({type: 0, text: tags(jk.text, user)})
			else joke.push(jk);
		})

		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: joke
		})
	},
	fact: (user, param)=>{
		let fact = [{"type": 0,"text": "Hey kids, it's time for a Fun Fact®!","say": "Hey kids, it's time for a Fun Fact!"}];
		facts[Math.floor(Math.random()*facts.length)].forEach(item=>{
			if(item.type == 0) fact.push({type: 0, text: tags(item.text, user), say: item.say != undefined ? tags(item.say, user) : undefined});
			else fact.push(item);
		})
		fact.push({type: 0, text: "o gee whilickers wasn't that sure interesting huh"});
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: fact
		})
	},
	owo: (user, param)=>{
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{type: 0, text: "*notices "+param+"'s BonziBulge™*", say: "notices "+param+"'s BonziBulge"}, {type: 0, text: "owo, what dis?"}]
		})
	},
	pitch: (user, param)=>{
		param = parseInt(param);
		if(isNaN(param) || param > 125 || param < 15) return;
		user.public.voice.pitch = param;
		user.room.emit("update", user.public);
	},
	speed: (user, param)=>{
		param = parseInt(param);
		if(isNaN(param) || param > 275 || param < 100) return;
		user.public.voice.speed = param;
		user.room.emit("update", user.public);
	},
	wordgap: (user, param)=>{
		param = parseInt(param);
		if(isNaN(param) || param < 0 || param > 15) return;
		user.public.voice.wordgap = param;
		user.room.emit("update", user.public);
	},
	godmode: (user, param)=>{
    param = crypto.createHash("sha256").update(param).digest("hex");
		if(param == config.godword){
			user.level = 2;
			user.socket.emit("update_self", {
				level: 2,
				roomowner: user.room.ownerID == user.public.guid
			})
		}
	},

  pope: (user, param)=>{
		user.public.color = "pope";
		user.room.emit("update", user.public);
	},

  kick: (user, param)=>{
		let tokick = find(param);
		if(tokick == null || tokick.level >= user.level) return;
		tokick.socket.emit("kick", user.public.name);
		tokick.socket.disconnect();
	},
}

function find(guid){
	let usr = null;
	let rooms = module.exports.rooms;
	Object.keys(rooms).forEach((room)=>{
		Object.keys(rooms[room].users).forEach(user=>{
			if(rooms[room].users[user].public.guid == guid) usr = rooms[room].users[user];
		})
	})
	return usr;
}
