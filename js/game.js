//create a canvas
//debug mode
const debug = true;
let frame = 0;
const groundheight = 150;
const canvas = document.getElementById("canvas");
const ctx= canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 720;
let deltaTime = 0;

//react to key presses
const keys = [];
document.addEventListener("keydown", function(e){
  switch(e.keyCode){
  // spacebar
  case 32:
    player.useWeapon();
    break;
    //left mouse button
  case 1:
    player.useWeapon();
    break;
  // left arrow
  case 37:
    enemy.useWeapon()
    break;
  // up arrow
  case 38:
    player.walk();
    break;
  default:
    break;
  }
});



// game objects list
const gameObjectsList = [];

function updateGameobjects(){
  gameObjectsList.forEach(gameObject => {
    //if (gameObject.hasParent) return;

    gameObject.update();
    //gameObject.draw();
  });
}

//create a game object
class GameObject {
  constructor(x,y,pivotX,pivotY
    ,width,height,src){
    this.x = x;
    this.y = y;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.parentOffsetX = 0;
    this.parentOffsetY = 0;
    this.width = width;
    this.height = height;
    this.rotation = 0;
    this.color = null;
    //check if src is the path to an image
    if(src.toString().includes(".png") || src.toString().includes(".jpg")){
      const image = new Image();
      image.src = src;
      this.image = image;
    } else {
      this.color = src;
    }

    this.children = [];
    this.parent = null;
    this.hasParent = false;
    this.collider = null;
    gameObjectsList.push(this);
  }
  get globalPosition(){
    if (this.parent != null){
      let {x,y}= rotate(this.parentOffsetX, this.parentOffsetY, this.parent.globalPosition.rotation);
      return {x:x+this.parent.globalPosition.x ,y:y+this.parent.globalPosition.y,rotation:this.parent.rotation+this.rotation};
    }
    else
    return {x:this.x,y:this.y,rotation:this.rotation};
  }
  //global position

  addCollider(collider,offsetX=0,offsetY=0){
    collider.parent = this;
    collider.yOffset = offsetY;
    collider.xOffset = offsetX;

    this.collider = collider;
  }
  updateCollider(){
    //include the rotation of the parent
    let {x,y}= rotate(this.collider.xOffset, this.collider.yOffset, this.globalPosition.rotation);
    this.collider.x = this.globalPosition.x+ x;
    this.collider.y = this.globalPosition.y+ y;
  }
  isColliding(other){
    if (this.collider == null) return false;
    if (other.collider == null) return false;
    return this.collider.isColliding(other.collider);
  }
  addChild(child){
    child.hasParent = true;
    child.parent = this;
    this.children.push(child);
  }

  draw(){
    if (this.color!=null){

      ctx.fillStyle = this.color;
      ctx.fillRect(this.x,this.y,this.width,this.height);
    }else {
      ctx.save();
      ctx.translate(this.globalPosition.x, this.globalPosition.y);
      ctx.rotate(this.globalPosition.rotation);
      ctx.drawImage(this.image, -this.pivotX, -this.pivotY, this.width, this.height);


      if (debug) {
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 5, 5);
      }
      ctx.restore();

    }

  }
  drawInfront (){
    ctx.save();
    ctx.translate(this.x+this.pivotX,this.y+this.pivotY);
    ctx.rotate(this.rotation);

    ctx.drawImage(this.image,-this.pivotX,-this.pivotY,this.width,this.height);
    if (debug){
      ctx.fillStyle = "red";
      ctx.fillRect(0,0,5,5);
    }
    ctx.restore();
  }
  update(){

    this.draw();
    if (this.collider){
      this.updateCollider();
      if (debug)
      this.collider.draw();
    }

  }

}

//create a character base class
class Character extends GameObject{
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
    this.activeWeapon = null;
  }
  draw(){
   super.draw();


  }

  update(){
    super.update();

  }
  useWeapon(){
    if (this.activeWeapon == null) return;
    if (this.activeWeapon instanceof Weapon)
      this.activeWeapon.strike();
  }
  equip(item,pivotX,pivotY,rotation=0) {
    item.parentOffsetX = pivotX;
    item.parentOffsetY = pivotY;
    item.x = pivotX-item.pivotX;
    item.y = -pivotY-item.pivotY;

    item.rotation = rotation*Math.PI/180;
    this.activeWeapon = item;
    super.addChild(item);
  }
}

//create a player
class Player extends Character {
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);

  }

  draw(){
     super.draw();

  }
  update(){
    super.update();
    this.walk()

  }
  jump(){
    this.y -= 10;
  }

  //wiggly walking animation
  walk(){
    //wiggle forward and back
    this.rotation = Math.sin(frame/10)/15;
    //up and down
    this.y += Math.sin(frame/10);
  }


}
//weapon class
class Weapon extends GameObject {
  constructor(x, y, pivotX, pivotY, width, height, src) {
    super(x, y, pivotX, pivotY, width, height, src);
    this.isAttacking = false;
    this.cooldown = 1000;
    this.lastAttack = 0;
  }

  draw() {
    super.draw();
  }

  update() {
    super.update();

  }

  animate() {
    //this.rotation += -Math.sin(frame/10)/12;
    this.strike();
  }

  strike() {
    //check if the weapon is on cooldown
    if (Date.now() - this.lastAttack < this.cooldown) return;
    //set the last attack time to now
    this.lastAttack = Date.now();
    let targetX = 200;
    let targetY = -100;
    let targetRotation = 30*Math.PI/180;

    this.moveTowards(targetX, targetY, targetRotation, 0, 500, () => {
      this.moveTowards(-targetX, -targetY, -targetRotation, 0, 600);
    });

    //punch the sword forward
    //move the sword to the right for 1 second


  }


  //function to move the sword to a position and rotate it
  moveTo(x,y,rotation,time,duration){

    this.parentOffsetX+=smoothstepDerivative(0,x,time/duration);
    this.parentOffsetY+=smoothstepDerivative(0,y,time/duration);
  }

  //function to move the sword to a position and rotate it
  moveTowards(x,y,rotation,time,duration,callback=0){
    //start time
    let startTime = Date.now();
    var distX = 0;
    var distY = 0;
    var distRot = 0;
    var initialRotation = this.rotation;
    var initialOffsetX = this.parentOffsetX;
    var initialOffsetY = this.parentOffsetY;
    //the animation function
    let animation = () => {
      //calculate the time
      let time = Date.now()-startTime;
      //if the time is greater than the duration
      if (time>duration){
        //set the sword to the final position
        this.parentOffsetX = x+initialOffsetX;
        this.parentOffsetY = y+initialOffsetY;
        this.rotation = (rotation+initialRotation);
        //go to initial position
        if (callback)
        callback()
        return;
      }
      //move the sword to the right for 1 second and back
      let newX = smoothstep(0,x,time/duration)-distX;
      let newY = smoothstep(0,y,time/duration)-distY;
      let newRot = smoothstep(0,rotation,time/duration)-distRot;

      distX += newX;
      distY += newY;
      distRot += newRot;
      this.parentOffsetX+=newX;
      this.parentOffsetY+=newY;
      this.rotation+=newRot;
console.log(distRot);

      //call the animation function again
      requestAnimationFrame(animation);
    }
    //call the animation function
    animation();

  }

}
//animation class
class Animation{
  constructor(duration){
    this.duration = duration;
  }
  run(){
    //start time
    let startTime = Date.now();
    //the animation function
    let animation = () => {
      //calculate the time
      let time = Date.now()-startTime;
      //if the time is greater than the duration
      if (time>this.duration){
        //call the next animation
        if (this.animations.length>0){
          this.animations.shift().run();
        }
        return;
      }
      //call the animation function again
      requestAnimationFrame(animation);
    }
    //call the animation function
    animation();
  }
}
//function to run multiple animations one after the other
function animations(duration, ...animations) {
  //start time
  let startTime = Date.now();
  //the animation function
  let animation = () => {
    //calculate the time
    let time = Date.now()-startTime;
    //if the time is greater than the duration
    if (time>duration){
      //call the next animation
      if (animations.length>0){
        //g
        animations.shift()(0,duration);
      }
      return;
    }
    //call the animation function again
    requestAnimationFrame(animation);
  }
  //call the animation function
  animation();
}

class Bat extends Weapon {
  constructor(x, y, pivotX, pivotY, width, height, src) {
    super(x, y, pivotX, pivotY, width, height, src);
    this.isAttacking = false;
    this.cooldown = 1000;
    this.lastAttack = 0;

  }

  draw() {
    super.draw();
  }

  update() {
    super.update();

  }

  strike() {
    //check if the weapon is on cooldown
    if (Date.now() - this.lastAttack < this.cooldown) return;
    //set the last attack time to now
    this.lastAttack = Date.now();

    //punch the sword forward
    //move the sword to the right for 1 second
    animations(1000, (time, duration) => {
        this.swing(time, duration);
      }
    );
  }
  swing(time, duration) {
    //move the sword to the right for 1 second and back
    if (time > duration / 2) {
      this.rotation = smoothstep(-Math.PI/2, 0, (time / duration)*2-1 );
      return;
    }
    this.rotation = smoothstep(0, -Math.PI/2, (time / duration)*2);

  }
}

//lerp function
function lerp(start, end, time) {
  return start + (end - start) * time;
}

//smoothstep function between two values
function smoothstep(start, end, time) {
  //clamp time between 0 and 1
  time = Math.max(0, Math.min(time, 1));
  //smoothstep
  return start + (end - start) * time * time * (3 - 2 * time);
}
//smoothstep function between two values

//derivative of smoothstep
function smoothstepDerivative(start, end, time) {
  //clamp time between 0 and 1
  time = Math.max(0, Math.min(time, 1));
  //smoothstep
  return 6 * (end - start) * time * (1 - time);
}

//create a wrapper function to make animation easier
function sanimations(duration, callback) {
let startTime = Date.now();
  function animater() {
    let time = Date.now() - startTime;
    if (time > duration) return;
    callback(time, duration);
    requestAnimationFrame(animater);
  }
  requestAnimationFrame(animater);
}

//add blood particles
class Blood extends GameObject {

  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
    this.rotation = Math.random()*Math.PI*2;
    this.x = x;
    this.y = y;
    this.vx = Math.random()*10-5;
    this.vy = Math.random()*10-5;
    this.alpha = 1;
  }
  draw(){
    super.draw();
  }
  update(){
    super.update();
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.01;
    if (this.alpha < 0) this.alpha = 0;
  }

}
const bloods = [];
//make the blood appear when the enemy is hit
function blood(x,y){
  for (let i = 0; i < 10; i++){
    let blood = new Blood(x,y,0,0,10,10,"red");
    bloods.push(blood);
  }

}

//create a sword
class Sword extends Weapon {
  constructor(x,y,pivotX,pivotY, width,height,src){
    super(x,y,pivotX,pivotY, width,height,src);
  }

  draw(){
    super.draw();
  }
  update(){
    super.update();
  }
  animate(){
    //punch the sword forward
    this.rotation += Math.sin(frame/10)/30

  }
}


//create an enemy
class Enemy extends Character {
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
  }
  draw(){
    super.draw()
  }
  update(){
    super.update();
    this.rotation = Math.pow(Math.sin(frame/10),5)/10;
    //up and down
    this.x += Math.sin(frame/10)*3;
  }
  //when the enemy is hit
  hit(){
    //make the enemy bleed
    blood(this.x,this.y);
    //make the enemy jump up

  }
}








//create moving hills in the background
class Hills extends GameObject {
  constructor(x,y,pivotX,pivotY, width,height,src){
    super(x,y,pivotX,pivotY, width,height,src);
    this.speed = 1;
  }
  draw(){
    super.draw();
  }
  update(){
    super.update();
    this.x -= this.speed;
    if (this.x < -this.width) {
      this.x = canvas.width;
    }
  }


}

//collision sphere
class SphereCollider {
  constructor(radius){
    this.x = 0;
    this.y = 0;
    this.yOffset = 0;
    this.xOffset = 0;
    this.radius = radius;
    this.parent = null;
  }
  draw(){
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
    ctx.stroke();
  }
  update(){
    this.x = this.parent.globalX + this.xOffset;
    this.y = this.parent.globalY + this.yOffset;
  }
  isColliding(other){
    let distance = Math.sqrt((this.x-other.x)**2+(this.y-other.y)**2);
    return distance < this.radius + other.radius;
  }

}

//rotation matrix
function rotate(x,y,angle){
  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  return {
    x: x*cos - y*sin,
    y: x*sin + y*cos
  }
}



//create a player
const hills = new Hills(0,700,0,0,600,300,"img/hill1.png");
const ground = new GameObject(0,620,0,0,canvas.width,groundheight, "green");
const player = new Player(200,600,150,250,300,300,"img/Schweindal.png");
const sword = new Sword(0,0,35,200,70,220,"img/Sword.png");
const bat = new Bat(0,0,20,240,40,200,"img/Bat.png");
const enemy = new Enemy(500,520,100,250,200,400,"img/metzger.png");
const collider = new SphereCollider(50);
sword.addCollider(new SphereCollider(10),0,-180);

player.equip(sword,40,10,95);
player.addCollider(collider,100,-40 );
enemy.equip(bat,-20,30);
console.log(collider.x+" "+collider.y);
blood(100,100);

let lastTime = 0;
//animate
function animate(){
  //calculate the delta time
  let now = Date.now();
  deltaTime = now - lastTime;
  lastTime = now;
  frame++;
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  //read the input
  updateGameobjects();
  //set the frame rate to 60fps



  requestAnimationFrame(animate);
}


animate();
