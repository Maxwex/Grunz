//create a canvas
//debug mode
const debug = false;
let frame = 0;
const groundheight = 150;
const canvas = document.getElementById("canvas");
const ctx= canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 720;
var deltaTime = 0;

//onload

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
  instantiate(image){
    let clone = new Enemy(this.x,this.y,this.pivotX,this.pivotY,this.width,this.height,this.image.src);
    this.image = image;
    return clone;
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
      this.collider.update();

    }

  }
  destroy(){
    this.children.forEach(child => {
      child.destroy();
    }
    );
    gameObjectsList.splice(gameObjectsList.indexOf(this),1);
  }


}

//create a character base class
class Character extends GameObject{
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
    this.activeWeapon = null;
    this.blood = null;
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
    if (item instanceof Weapon){
      this.activeWeapon = item;

    }
    super.addChild(item);
  }
  addBlood(blood,pivotX,pivotY){
    this.blood = blood;
    this.equip(blood,pivotX,pivotY)
  }
  onHit(damage){
    console.log("ouch");
  }
  bleed(){
    if (this.blood == null) return;
    this.blood.start()
  }
  //check if the character is colliding with another character
  collides(){
    //loop through all the game characters
    for (let i = 0; i < gameObjectsList.length; i++) {
      //check if the game object is a character
      if (gameObjectsList[i] instanceof Character){
        //check if the character is colliding with the current character
        if (gameObjectsList[i] !== this){
          if (gameObjectsList[i].isColliding(this)){
            return true
            //return the colliding character
          }
        }
      }
    }
    return false;
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
    let targetX = 100;
    let targetY = -100;
    let targetRotation = -30*Math.PI/180;

    this.moveTowards(targetX, targetY, targetRotation, 0, 300, () => {
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




//particle class
class Particle{
  constructor(x,y,initialVx,initialVy,color,size,lifeTime){
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = initialVx;
    this.vy = initialVy;
    this.lifetime = lifeTime

  }
  draw(){
     ctx.fillStyle = this.color;
    ctx.fillRect(this.x,this.y,this.size,this.size);
  }
  update(){
    if (this.lifetime<0) return;
    this.lifetime -= deltaTime;
    this.x += this.vx;
    this.y += this.vy;
    //gravity
    var a = 0.19;
    this.vy += a;
    this.draw();
  }
  revive(x,y,initialVx,initialVy,lifeTime){
    this.x = x;
    this.y = y;
    this.lifetime = lifeTime;
    this.vx = initialVx;
    this.vy = initialVy;
  }

}

//add blood particles
class Blood extends Particle {
  constructor(x, y, vx, vy, color, size, lifeTime) {
    super(x, y, vx, vy,color,size,lifeTime);

  }

  draw() {
    super.draw();
  }
  update() {
    super.update();
  }

}

class ParticleSystem extends GameObject{
  constructor(x,y,size) {
    super(x,y,0,0,0,0,"");
    this.particles = [];
    this.size = size;
    this.running = false;
    this.initiated = false;
    this.lifeTime = 1000;
this.count = 0;

  }
  draw() {

  }
  update() {
    if (!this.running) return;
    this.count+=deltaTime;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
    }
    super.update();
if (this.count>this.lifeTime){
  this.stop();

}
  }

  init() {
    this.initiated = true;
    console.log("init");
    for (let i = 0; i < this.size; i++) {
      var random = Math.random()*10 - 5;
    this.particles[i] = new Blood(this.globalPosition.x, this.globalPosition.y, Math.sin(random)*Math.random()*5 , Math.cos(random)*Math.random()*5, "red", 5, this.lifeTime);    }
  }
  stop() {
    this.running = false;
  }
  start() {
    this.running = true;
    this.count = 0;
    if (this.initiated){
      for (let i = 0; i < this.size; i++) {
        var random = Math.random()*Math.PI*2 - Math.PI;
        this.particles[i].revive(this.globalPosition.x, this.globalPosition.y, Math.sin(random)*Math.random()*5 , Math.cos(random)*Math.random()*5, this.lifeTime);
      }
    } else {
      this.init()
    }

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
    this.ishit = false;
  }
  draw(){
    super.draw()
  }
  update(){
    super.update();
    this.rotation = Math.pow(Math.sin(frame/10),5)/10;
    //up and down
    //this.x += Math.sin(frame/10)*3;
    //dont move through the player
    if ((this.x>player.x+300)&&!this.collides()){
      this.move()
    }

    this.checkHit()
  }
  move(){
    this.x -= deltaTime/10;
  }
  //when the enemy is hit
  hit(){
    //make the enemy bleed

    if (this.blood.running) return;
    this.bleed()
    //make the enemy jump up

  }
  //check if the enemy is hit
  checkHit(){
    //check if the enemy is hit
    if (this.collider == null) return;
    if (sword.collider.isColliding(this.collider)){
      this.hit();
      this.ishit = true;
    }else {
      this.ishit = false;
    }
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
    let {x,y}= rotate(this.xOffset,this.yOffset,this.parent.globalPosition.rotation);
    this.x = this.parent.globalPosition.x+ x;
    this.y = this.parent.globalPosition.y+ y;
    if (debug) this.draw();
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

//spawner
const spawner = {
  enemies : [],
  count : 0,
  spawnEnemie: function () {
    return new Enemy(1500,520,100,250,200,400,"img/metzger.png");
  } ,

  manageEnemies: function () {
    //create a new enemy every 2 seconds or when there are less than 3 enemies
    if ( this.count>4000&& this.enemies.length<3){
      //spawn a new enemy
      let enemie = this.spawnEnemie();
      //add collider
      let collider = new SphereCollider(80);
      enemie.addCollider(collider,10);
      this.enemies.push(enemie);
      this.count = 0;
    }
    this.count += deltaTime;

  }
}


//create a player
const hills = new Hills(0,700,0,0,600,300,"img/hill1.png");
const ground = new GameObject(0,620,0,0,canvas.width,groundheight, "green");
const player = new Player(200,600,150,250,300,300,"img/Schweindal.png");
const sword = new Sword(0,0,35,200,70,220,"img/Sword.png");
const bat = new Bat(0,0,20,240,40,200,"img/Bat.png");
const enemy = new Enemy(600,520,100,250,200,400,"img/metzger.png");
const collider = new SphereCollider(50);
const enemyCollider = new SphereCollider(80);
enemy.addCollider(enemyCollider,10,-40);
sword.addCollider(new SphereCollider(10),0,-180);

player.equip(sword,40,10,95);
player.addCollider(collider,100,-40 );
enemy.equip(bat,-20,30);
const particles = new ParticleSystem(100,100,1300);
enemy.addBlood(particles,0,0);

//enemy.addChild(particles);
let lastTime = Date.now();
//animate
function animate(){
  //calculate the delta time
  let now = Date.now();
  deltaTime = now - lastTime;
  lastTime = now;
  //console.log("frames " + 1000/deltaTime);
  spawner.manageEnemies()
  frame++;
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  //read the input
  updateGameobjects();

  //set the frame rate to 60fps



  requestAnimationFrame(animate);
}


animate();
