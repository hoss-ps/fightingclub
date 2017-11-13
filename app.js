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
let leftRightStack =['R','L'];

class Entity  {
    constructor() {
      this.MaxLeft        = 0;
      this.MaxRight       = 450;
      this.bottom         = 400;
      this.border         = 5; // border arund character
      this.x              = 250;
      this.y              = 400;
      this.xPosition      = 0;
      this.yPosition      = 0;
      this.pressingRight  = false;
      this.pressingLeft   = false;
      this.pressingJump   = false;
      this.pressingDown   = false;
      this.pressingPunch  = false;
      this.pressingkick   = false;

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
    constructor(type,id,standPos) {
        super();
        this.id = id ;
//TODO:add it form db with if
        this.run       = 20;
        this.walk      = 10;
        this.jump      = 150;
        this.standPos  = standPos;
        if (standPos == 'L'){//'Right/Left'
            this.face      = 'R';
        }else{
            this.face      = 'L';
        }

        this.event     = "";//event
      //  this.gravity   = 0.2;
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
        this.loopCounter = 0;

        if (this.standPos == 'R'){
            this.x = this.MaxLeft + 50;
        }else if(this.standPos == 'L'){
            this.x = this.MaxRight - 50;

        }


      }


      _isCollision(secondPlayer){

        if (this.x < secondPlayer.x + secondPlayer.width + this.border &&
            this.x + this.width + this.border > secondPlayer.x && this.y < secondPlayer.y + secondPlayer.height + this.border &&
            this.height + this.y + this.border > secondPlayer.y && this.x != secondPlayer.x){
                return 'x';
            }
            else if (this.x == secondPlayer.x && this.y < secondPlayer.y + secondPlayer.height + this.border &&
                this.height + this.y + this.border > secondPlayer.y) {
                    return 'y';
         }else{
             return 'n';
         }




      }
     stopMove(){
      //  this.xPosition = 0;

     }

     attack(tself){
        for(let i in PLAYER_LIST){

            if (PLAYER_LIST[i].id != this.id){
                if (this._isCollision(PLAYER_LIST[i]) === 'x' ){
       //             console.log( ' player id: ' + PLAYER_LIST[i].id + ' has colission with player id: ' + this.id);

                    this.walking('x');
                    this.updatePosition();
                }else if (this._isCollision(PLAYER_LIST[i]) === 'y' ){
                    console.log( ' happend');
                    this.walking('y');
                    this.updatePosition();
                }

            }



        }


     }
     punch(){
        //TODO: add attack
        this.event="punch";

     }
     kick(){
        //TODO: add attack


        this.event="kick";
     }
     walking( colission = false) {
 //        console.log('x: '+this.x +' max: ' + this.MaxRight);


        if(this.pressingRight && this.x < this.MaxRight ){
            if (!colission){
            this.xPosition =  this.walk;
            this.event="walk";
            } else{
                this.xPosition = - this.walk;
                this.event="stand";
            }


        }else if(this.pressingLeft && this.x > this.MaxLeft ){
            if (!colission){
            this.xPosition = - this.walk;
            this.event="walk";
            }else{
            this.xPosition =  this.walk;
            this.event="stand";
            }

        }else if(colission==="x"){
            this.xPosition = 0 ;
            this.event="stand";
        }else if(colission==="y"){

            this.xPosition += 25;//this.xPosition;
            this.event="stand";
        }else{
            this.xPosition = 0 ;
            this.event="stand";
        }
     }
     jumping() {
        if(this.pressingJump && !this._isJumped){


                    this.preTime =  Date.now();
                    this._isJumped = true ;
                    this.yPosition -= this._jumpHeight;//;this.jump;

                   // this.velocity -= this.gravity * this.dt;
                    //this.yPosition = this.velocity * this.dt;


                    }else if (this._isJumped){
                        if (this.y < (this.bottom - this._jumpHeight)){
                            //comming down
                            this.event="jump";
                            let thisTime = (Date.now() - this.preTime ) * 0.01;
                           this.yPosition = (this._jumpHeight * thisTime - this. gravity * thisTime * thisTime) * 0.08;

                       //     this.yPosition = this._jumpHeight;
                        }else if(this.y >= this.bottom ){
                            //reach to ground
                            this.event="stand";
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
            this.event="stand";
         }

         if(this.pressingPunch ){
            this.punch();
        }
        if(this.pressingKick ){
            this.kick();
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
    let player = new Player('',socket.id,leftRightStack.pop());
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
        else if(data.inputId === 'punch')
            player.pressingPunch = data.state;
        else if(data.inputId === 'kick')
            player.pressingKick = data.state;

        });


    socket.on('disconnect',function(){
       leftRightStack.push(PLAYER_LIST[socket.id].standPos);
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
                event:player.event,
                standPosition:player.standPos,

            });
            player.attack(1);
        }

        for (let i in SOCKET_LIST){

            let socket = SOCKET_LIST[i];
            socket.emit('setPosition',Players_position);

                    }






    },1000/17);