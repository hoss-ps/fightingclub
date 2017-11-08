let express = require('express');
let app = express();
let serv = require('http').Server(app);


// routing part
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/fightingclub/index.html');
});
app.use('/fightingclub',express.static(__dirname + '/fightingclub'));

serv.listen(1100);
console.log("Server is started...")


let SOCKET_LIST = {};
let PLAYER_LIST = {};
class Entity  {
    constructor() {
      this.MaxLeft  = 0;
      this.MaxRight = 450;
      this.bottom = 400;
      this.border = 5; // border arund character
      this.x  = 250;
      this.y  = 400;
      this.xPosition = 0;
      this.yPosition = 0;
      this.pressingRight = false;
      this.pressingLeft  = false;
      this.pressingJump  = false;
      this.pressingDown  = false;

    }
    update() {
        this.updatePosition();
    }

    updatePosition() {
        this.x  += this.xPosition;
        this.y  += this.yPosition;
    }



}

class Player extends Entity {
    constructor(type,id) {
        super();
        this.id = id ;
//TODO:add it form db with if
        this.run       = 20;
        this.walk      = 10;
        this.jump      = 150;
        this.event     = "";//event

        this.velocity = 0;

        this.dt = 0.1;
        this.delay     = 100;
        this.goesDownDelay = 0;
        ///
        this._isJumped = false;
        this._jumpHeight = 50;

        this.width = 10;
        this.height=65;

        this. gravity = 1;
        this.preTime =  0;

        if (this.face == 'R'){
            this.x = this.MaxLeft + 50;
        }else if(this.face == 'L'){
            this.x = this.MaxRight - 50;

        }


      }
     walking( colission = false) {
        if(this.pressingRight && this.x < this.MaxRight ){
            this.xPosition =  this.walk;
        }else if(this.pressingLeft && this.x > this.MaxLeft ){
            this.xPosition = - this.walk;
        }else{
            this.xPosition = 0 ;
        }
     }
     jumping() {
        if(this.pressingJump && !this._isJumped){
                    this.preTime =  Date.now();
                    this._isJumped = true ;
                    this.yPosition -= this._jumpHeight;//;this.jump;
                    }else if (this._isJumped){
                        if (this.y < (this.bottom - this._jumpHeight)){
                            //comming down
                            let thisTime = (Date.now() - this.preTime ) * 0.01;
                           this.yPosition = (this._jumpHeight * thisTime - this. gravity * thisTime * thisTime) * 0.08;
                        }else if(this.y >= this.bottom ){
                            //reach to ground
                            this.y = this.bottom;
                            this.yPosition = 0;
                            this._isJumped = false;

                        }

                    }
     }

     update(pastMillisec) {


         if(this.pressingRight || this.pressingLeft){
             this.walking();
         }else{
            this.xPosition = 0;
         }

         if(this.pressingJump || this._isJumped ){
            this.jumping();
        }

        //khabidan
        if(this.pressingDown){
            this.yPosition = 0; //later add as lie down;
        }
        this.updatePosition();
    }

}



let io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    //when socket connected
    socket.id = Math.random(); //will get from db
    SOCKET_LIST[socket.id] = socket;
    let player = new Player('',socket.id);
    PLAYER_LIST[socket.id] = player;




    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'jump')
            player.pressingJump = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });


    socket.on('disconnect',function(){
       delete SOCKET_LIST[socket.id]; // medify it
       delete PLAYER_LIST[socket.id];
    });

    console.log('socket is connected...');
    console.log('player ('+socket.id+') is added...');




    });


let frameMillisec = 0;
    setInterval(function(){

        Players_position = [];
        for (let i in PLAYER_LIST){

            let player = PLAYER_LIST[i];
            player.update(frameMillisec);
            frameMillisec = Date.now();
            Players_position.push({
                x: player.x,
                y: player.y,
                face: player.face,
                event:player.event
            });
        }

        for (let i in SOCKET_LIST){

            let socket = SOCKET_LIST[i];
            socket.emit('setPosition',Players_position);

                    }

    },1000/25);