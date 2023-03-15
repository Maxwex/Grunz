//create a canvas
let frame = 0;
const groundheight = 100;
const canvas = document.getElementById("canvas");
const ctx= canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 720;

//create a player
class Player {

  constructor(x,y,width,height){
    this.x = x;
    this.y = y-height;
    this.width = width;
    this.height = height;
    this.rotation = 0;
    this.items = [];

    const image = new Image();

    image.src = "img/Schweindal.png";


    this.image = image;
    //set the pivot point to the center of the image
    this.pivotX = this.width/2;
    this.pivotY = this.height/4*3;

  }
  draw(){
    ctx.save();
    ctx.translate(this.x+this.pivotX,this.y+this.pivotY);

    ctx.rotate(this.rotation);
    ctx.drawImage(this.image,-this.pivotX,-this.pivotY,this.width,this.height);
    this.items.forEach(item => {

        item.draw();
      }
    );
    ctx.fillStyle = "red";
    ctx.fillRect(0,0,3,3);
    ctx.restore();

  }
  update(){
    this.walk()
    this.draw();

  }
  equip(item,pivotX,pivotY){
    item.x = pivotX;
    item.y = pivotY;
    this.items.push(item);


  }

  //wiggly walking animation
  walk(){
    //wiggle forward and back
    this.rotation = Math.sin(frame/10)/10;
    //up and down
    this.y += Math.sin(frame/10)*2;


  }
}

//create a sword
class Sword {
  constructor(x,y,pivotX,pivotY, width,height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rotation = 1;
    this.pivotX = pivotX;
    this.pivotY = pivotY;

    const image = new Image();
    image.src = "img/Sword.png";

    this.image = image;
  }
  draw(){
    ctx.save();
    ctx.translate(this.x,this.y);

    ctx.rotate(this.rotation);
    ctx.drawImage(this.image,-this.pivotX,-this.pivotY,this.width,this.height);
    ctx.fillStyle = "red";
    ctx.fillRect(0,0,3,3);
    ctx.restore();
  }
  update(){

  }
}

//create a game object
class GameObject {
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    this.x = x;
    this.y = y-height;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.width = width;
    this.height = height;
    this.rotation = 0;
    const image = new Image();
    image.src = src;
    this.image = image;
  }
  draw(){
    ctx.save();
    ctx.translate(this.x+this.pivotX,this.y+this.pivotY);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.image,-this.pivotX,-this.pivotY,this.width,this.height);
    ctx.restore();

  }

}

//create an enemy
class Enemy extends GameObject {
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
  }
  update(){
    this.rotation = Math.pow(Math.sin(frame/10),5)/10;
    //up and down
    //this.y += Math.sin(frame/20);
    this.draw();
  }

}

//create a ground
class Box {
  constructor(x,y,width,height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  draw(){
    ctx.fillStyle = "green";
    ctx.fillRect(this.x,this.y,this.width,this.height);
  }
}

//create a player
const player = new Player(100,canvas.height-groundheight,250,250);
const ground = new Box(0,canvas.height-groundheight,canvas.width,groundheight);
const sword = new Sword(300,300,35,200,70,220);
const enemy = new Enemy(500,canvas.height-groundheight+40,100,250,200,400,"img/metzger.png");
player.equip(sword,50,10);
//animate
function animate(){
  frame++;
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ground.draw();
  player.update();
enemy.update();
  requestAnimationFrame(animate);
}


animate();
