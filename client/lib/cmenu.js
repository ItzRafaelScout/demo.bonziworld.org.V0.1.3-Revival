function contextmenu(content, x, y, passthrough){
	if(window.cont != undefined){
		window.cont.remove();
        delete window.cont;
    }
	window.cont = document.createElement("ul");
	window.cont.id = "menu";
	window.cont.className = "contextmenu_cont";
	window.cont.style.top = y;
	content.forEach(item=>{
		let option = document.createElement("li");
		option.className = item.disabled ? "cmenu_disabled" : "cmenu_item";
		option.innerHTML = item.name;
		window.cont.appendChild(option);
		if(item.type == 0 && !item.disabled){
			option.onmouseup = ()=>{item.callback(passthrough)};
		}
	})
	document.body.appendChild(window.cont);
	x>innerWidth-window.cont.clientWidth ? window.cont.style.right = innerWidth-x : window.cont.style.left = x;
}
