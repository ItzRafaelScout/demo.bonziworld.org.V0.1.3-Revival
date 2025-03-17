class styleobject{
    constructor(width, height, swidth, sheight, image, anims){
        this.width = width;
        this.height = height;
        this.image = image;
        this.anims = anims;
        this.swidth = swidth;
        this.sheight = sheight;
        this.playing = false;
    }

    play(animno, mspf){
        if(this.playing) return;
        this.playing = true;
        let anim = this.anims[animno];
        let i = 0;
        let options = {};
        let animator = setInterval(()=>{
            //End if overshot
            if (i==anim.length){
                clearInterval(animator);
                this.playing = false;
                //Run the end function
                if(options.onend != undefined) options.onend();
            }
            else{
                //Set to current frame
                let left = anim[i]*this.width;
                let top = this.height * Math.floor(left/this.swidth);
                left %= this.swidth;
                this.self.style.backgroundPosition = "left -"+left+"px top -"+top+"px";
                //Inc frame
                i++;
            }
        }, mspf)
        //Editable object so onend can be set
        return options;
    }

    enter(id, parent, animation, rate, startingframe){
        this.id = id;
        let left = startingframe*this.width;
        let top = this.height * Math.floor(left/this.swidth);
        left %= this.swidth;
        document.getElementById(parent).insertAdjacentHTML("beforeend", "<div style='width:"+this.width+";height:"+this.height+";background-image:url(\""+this.image+"\");background-position: left -"+left+"px top -"+top+"px;' id='"+id+"'></div>");
        this.self = document.getElementById(id);

        //A rate of 0 implies no entry animation.
        if(rate>0) this.play(animation, rate);
    }

    kill(){
        this.self.remove();
    }
}

//Useful to add in for spritesheets, JS doesn't have a default range function
function range(bottom, to){
    let x = [];
    for(i=bottom;i<=to;i++){
        x.push(i);
    }
    return x;
}
