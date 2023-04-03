//create a canvas
//debug mode
const debug = false;
let timePassed = 0;
const groundheight = 150;

var player;
var bat;
var ground;
var sword;
var healthbar;
//create a popup function with a restart button



//add user input to make the player attack when the spacebar is pressed
document.addEventListener("keydown", function(event){

  if (event.keyCode == 32){
    if (debug)
      console.log("spacebar pressed")
    player.useWeapon()
  }

}
);


var deltaTime = 0;
let lastTime = Date.now();

var myGame;

//create a sound table
var soundTable = {
  "pigHit": new sound("sounds/pigHit.mp3"),
  "pigdeath": new sound("sounds/death.wav"),
  "enemyHit": new sound("sounds/enemyHit.mp3"),
  "enemyDead": new sound("sounds/enemyDead.mp3"),
  "bloodSplat1": new sound("sounds/bloodSplat1.mp3"),
}

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}
//function to start the game
function startGame(){
  myGame = new Game(1200,700);

  initializeGameObjects();
  myGame.start(myGame);
}

function initializeGameObjects(){

  ground = new GameObject(0,620,0,0,myGame.canvas.width,groundheight, "green");
  healthbar =new HealthBar(20,15,100,50,200,20);
  bat  = new Bat(0,0,18,180,36,200,"img/Bat.png");
  player =new Player(200,600,150,250,300,300,"img/Schweindal.png");
  player.addCollider(new SphereCollider(50),100,-50);
  sword = new Sword(0,0,35,200,70,220,"img/Sword.png");
  sword.damage = 40;
  sword.addCollider(new SphereCollider(10),0,-180);
  const pigParticle = new ParticleSystem(0,0,130);
  player.addBlood(pigParticle,100,-100);
  player.equip(sword,40,10,95);


}
class Game{
  constructor(width,height){
    this.canvas = document.getElementById("canvas");
    this.ctx= this.canvas.getContext("2d");
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvasUI = document.getElementById("canvasUI");
    this.ctxUI= this.canvasUI.getContext("2d");
    this.canvasUI.width = width;
    this.canvasUI.height = height;

    this.gameObjectsList= [];
    this.weaponList = [];

    this.enemieCount = 0;
    this.killedEnemies = 0;
    this.over = false;

  }
  reorganizeGameObjects(){
    this.gameObjectsList.sort(function(a,b){
      return a.zIndex - b.zIndex;
    })
  }
  drawBackground() {
    this.ctx.fillStyle = "skyblue";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  }
  updateGameobjects(){
    this.gameObjectsList.forEach(gameObject => {
      //if (gameObject.hasParent) return;

      gameObject.update();
      //gameObject.draw();
    });
  }
  start(){
    updateUi()
    function gameLoop(game){
      //
      deltaTime = Date.now() - lastTime;
      lastTime = Date.now();
      timePassed+= deltaTime;

      myGame.drawBackground();
      spawner.manageEnemies()
      //update the game
      myGame.updateGameobjects();


      if (myGame.over){
        updateUi()
        return;
      }


      requestAnimationFrame(gameLoop);
    }
    gameLoop(this);
  }
  restart(){
    this.gameObjectsList = [];
    this.weaponList = [];
    this.enemieCount = 0;
    this.killedEnemies = 0;
    this.over = false;
    initializeGameObjects();
    this.start();
  }
  gameOver(){
    this.over = true;
    //game over popup
    const popup = new Popup("Game Over", "butt","Restart", () => {
      //restart the game
      this.restart();
    });
  }


}






function updateUi(){
  var ctxUI = myGame.ctxUI;
  ctxUI.clearRect(0,0,myGame.canvasUI.width,myGame.canvasUI.height);
  ctxUI.fillStyle = "orange";
  ctxUI.fillRect(0,0,myGame.canvasUI.width,50);
  ctxUI.fillStyle = "white";
  ctxUI.font = "20px Arial";
  //show number of killed enemies on right side of the screen
  ctxUI.fillText("Killed Enemies: " + myGame.killedEnemies, myGame.canvasUI.width - 200, 30);
  healthbar.draw();
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
    this.zIndex = 0;
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
    myGame.gameObjectsList.push(this);
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
  rotateTowards(rotation,time,duration,callback=null){
    //start time
    let startTime = Date.now();
    var initialRotation = this.rotation;
    var distRot = 0;
    //the animation function
    let animation = () => {
      //calculate the time
      let time = Date.now()-startTime;
      //if the time is greater than the duration
      if (time>duration){
         if (callback != null) callback();
        return;
      }
      //move the sword to the right for 1 second and back
      let newRot = smoothstep(0,rotation,time/duration)-distRot;
      distRot += newRot;
      this.rotation +=newRot;
      //call the function again
      requestAnimationFrame(animation);
    }
    //call the function
    animation();
  }
  moveLinear(x,y,time,duration){
    //start time
    let startTime = Date.now();
    var distX = 0;
    var distY = 0;

    //the animation function
    let animation = () => {
      //calculate the time
      let time = Date.now()-startTime;
      //if the time is greater than the duration
      if (time>duration){
        return;
      }
      //move the sword to the right for 1 second and back
      let newX = smoothstep(0,x,time/duration)-distX;
      let newY = smoothstep(0,y,time/duration)-distY;
      distX += newX;
      distY += newY;
      this.x +=newX
      this.y +=newY
      //call the function again
      requestAnimationFrame(animation);
    }
    //call the function
    animation();
  }
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
      let newX = Math.round(smoothstep(0,x,time/duration)-distX);
      let newY = (smoothstep(0,y,time/duration)-distY)|0;
      let newRot = smoothstep(0,rotation,time/duration)-distRot;

      distX += newX;
      distY += newY;
      distRot += newRot;
      this.parentOffsetX+=newX;
      this.parentOffsetY+=newY;
      this.rotation+=newRot;

      //call the animation function again
      requestAnimationFrame(animation);
    }
    //call the animation function
    animation();

  }
  draw(){
    let ctx= myGame.ctx;
    ctx.save();
    ctx.translate(this.globalPosition.x, this.globalPosition.y);
    ctx.rotate(this.globalPosition.rotation);
    if (this.color!=null){

      ctx.fillStyle = this.color;
      ctx.fillRect(-this.pivotX,-this.pivotY,this.width,this.height);
    }else {

      ctx.drawImage(this.image, -this.pivotX, -this.pivotY, this.width, this.height);


      if (debug) {
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 5, 5);
      }


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
    myGame.gameObjectsList.splice(myGame.gameObjectsList.indexOf(this),1);
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
    this.ishit = false;
    this.health = 100;
    this.dead = false;
    this.deathSound = null;
    this.gravity = 0.5;
    this.grounded = true;
    this.jumpSpeed = 5;
    this.ypos = y;
    this.velocity = 0;
    this.affectedByGround= true;
  }
  jump(){
    if (!this.grounded) return;
      this.velocity = -this.jumpSpeed;
  }
  playDeathSound(){
    if (this.deathSound == null) return;
    this.deathSound.play();
  }
  takeDamage(damage){
    if (this.dead) return;
    this.jump()
    if (damage>=this.health){
      this.health = 0;
      this.dead = true;
      this.onDeath();

    }else{
      this.health-=damage;
    }

  }
  onDeath(){
    this.dead = true;
    this.playDeathSound();
    this.destroy();

  }
  draw(){
   super.draw();
  }

  update(){
    super.update();
    this.velocity += this.gravity;
    if (this.ypos>this.y+this.velocity||!this.affectedByGround){
      this.y+=this.velocity*deltaTime/20;
      this.grounded = false;
    }else {
      this.y = this.ypos;
      this.grounded = true;
    }
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

  bleed(){
    if (this.blood == null) return;
    this.blood.start()
  }

  //check if the character is colliding with another character
  collides(){
    //loop through all the game characters
    for (let i = 0; i < myGame.gameObjectsList.length; i++) {
      //check if the game object is a character
      if ( myGame.gameObjectsList[i] instanceof Character){
        //check if the character is colliding with the current character
        if ( myGame.gameObjectsList[i] !== this){
          if ( myGame.gameObjectsList[i].isColliding(this)&&this.zIndex> myGame.gameObjectsList[i].zIndex){
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
    this.deathSound = soundTable["pigdeath"];
    this.hitSound = soundTable["pigHit"];
  }

  draw(){
     super.draw();

  }
  update(){
    super.update();
    this.walk()
    this.checkCollision();
    console.log("GRUNT");

  }
  onDeath() {
    myGame.gameOver();
  }

  //wiggly walking animation
  walk(){
    //wiggle forward and back
    this.rotation = Math.sin(timePassed/200)/15;
    //up and down
    this.y += Math.sin(timePassed/100)|0;
  }
  checkCollision(){
    //loop through all the weapons
    for (let i = 0; i < myGame.weaponList.length; i++) {
      //check if the weapon is colliding with the player
      if ( myGame.weaponList[i].isColliding(this)){
        //if the weapon is colliding with the player
        if (this.ishit) return;
        //take damage
        this.takeDamage(myGame.weaponList[i].damage);
        this.ishit = true;
        //play the blood animation
        this.bleed();
        //update the UI
        updateUi();
        return;
      }
    }
    this.ishit = false;



  }
  takeDamage(damage) {
      super.takeDamage(damage);
      healthbar.health = this.health;
      this.hitSound.play();
      this.bleed();
      updateUi()
  }


}
//weapon class
class Weapon extends GameObject {
  constructor(x, y, pivotX, pivotY, width, height, src) {
    super(x, y, pivotX, pivotY, width, height, src);
    this.isAttacking = false;
    this.cooldown = 1000;
    this.lastAttack = 0;
    this.damage = 10;
    myGame.weaponList.push(this);
  }

  draw() {
    super.draw();
  }

  update() {
    super.update();

  }


  strike() {


  }
  destroy() {
    super.destroy();
    myGame.weaponList.splice(myGame.weaponList.indexOf(this), 1);
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
    this.cooldown = 2000;
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
    var rotation = -80*Math.PI/180;
    this.moveTowards(0, 0, rotation, 0, 300,
      () => {
      this.moveTowards(0, 0, -rotation, 1000, 700)
      });
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
    let ctx = myGame.ctx;
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
//create a health bar
class HealthBar extends GameObject{

  constructor(x,y,pivotX,pivotY, width,height) {
    super(x, y, pivotX, pivotY, width, height, "black");
    this.health = 100;
    this.maxHealth = 100;
    this.border = 4;

  }

update() {
  super.update();
}

  draw() {
    //super.draw();
    let ctxUI = myGame.ctxUI;
    ctxUI.fillStyle = "black";
    ctxUI.fillRect(this.globalPosition.x, this.globalPosition.y, this.width, this.height);
    ctxUI.fillStyle = "red";
    ctxUI.fillRect(this.globalPosition.x + this.border, this.globalPosition.y + this.border, this.width - this.border*2, this.height - this.border*2);
    ctxUI.fillStyle = "green";
    ctxUI.fillRect(this.globalPosition.x + this.border, this.globalPosition.y + this.border, (this.width - this.border*2) * (this.health/this.maxHealth), this.height - this.border*2);

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
    this.rotation += Math.sin(timePassed/10)/30

  }
  strike() {
    if (Date.now() - this.lastAttack < this.cooldown) return;
    //set the last attack time to now
    this.lastAttack = Date.now();
    super.strike();
    //check if the weapon is on cooldown

    let targetX = 100;
    let targetY = -100;
    let targetRotation = -30*Math.PI/180;

    this.moveTowards(targetX, targetY, targetRotation, 0, 300, () => {
      this.moveTowards(-targetX, -targetY, -targetRotation, 0, 600);
    });

  }
}


//create an enemy
class Enemy extends Character {
  constructor(x,y,pivotX,pivotY
              ,width,height,src){
    super(x,y,pivotX,pivotY
              ,width,height,src);
    this.ishit = false;
    this.lastHit = 0;
    this.hitSound = soundTable["enemyHit"];
    this.deathSound = soundTable["enemyDead"];
    this.bleedSound = soundTable["bloodSplat1"];

  }
  draw(){
    super.draw()
  }
  update(){
    this.checkHit()
    this.lastHit += deltaTime;
    super.update();
    //this.rotation = Math.pow(Math.sin(frame/10),5)/10;
    //up and down
    //this.x += Math.sin(frame/10)*3;
    //dont move through the player
    if ((this.x>player.x+300)&&!this.collides()){
      this.move()
    }else if (this.x<player.x+300)
      this.attack()
  }
  move(){
    this.x -= deltaTime/10;
    this.rotation = Math.sin(timePassed/200)/10;
  }
  //when the enemy is hit
  hit(){
    //make the enemy bleed
    this.bleed()
    this.bleedSound.play()
    this.takeDamage(sword.damage)
    if (this.dead) return;
    console.log(this.health)
    //play the hit sound
    this.hitSound.play()
    //make the enemy jump up
    this.jump()
    this.moveLinear(60,0,0,100)
   // this.x += 20;
  }
  jump(){
   super.jump()
    //this.dieAnimation()
  }
  onDeath() {
    this.dead = true;
    this.playDeathSound()
    this.dieAnimation()
    myGame.enemieCount--;
    myGame.killedEnemies++;
    updateUi()
  }

  //check if the enemy is hit
  checkHit(){
    //check if the enemy is hit
    if (this.collider == null) return;
    if (sword.collider.isColliding(this.collider)){
      if (!this.ishit&&this.lastHit>800) {
        this.hit();
        this.lastHit = 0;
      }


      this.ishit = true;
    }else {
      this.ishit = false;
    }
  }
  die(){
    dieAnimation()

  }
  dieAnimation(){

    //turn the enemy around
    this.rotateTowards(Math.PI,0,1000,    this.destroy.bind(this));

   //make the enemy fall down
    this.affectedByGround = false;
    this.gravity = 0.1;
    this.velocity = 1;

  }

  // use weapon to attack player when in range
  attack(){
      //attack the player
      this.useWeapon();
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
//ui class
class UI {
  constructor(){
    this.healthBar = new HealthBar(20,20,0,0,200,20);
    this.healthBar.maxHealth = 100;
    this.healthBar.health = 100;
  }
  draw(){
    this.healthBar.draw();
  }
  update(){
    this.healthBar.update();
  }
  showPopup(text){
    this.popup = new Popup(text);
  }
  //game over
  gameOver(){
    this.showPopup("Game Over");
  }
}
//popup class displays text on the screen as html elements
class Popup {
  constructor(text,id, callbackText, callback){
    this.callback = callback;
    this.text = text;
    //add the popup to the canvas-holder
    this.element = document.createElement("div");
    //add the text as a p element
    this.element.innerHTML = "<p>"+text+"</p>";
    //add the id
    this.element.id = id;
    //add the button
    this.element.innerHTML += "<button>"+callbackText+"</button>";
    //add the callback
    this.element.querySelector("button").addEventListener("click", this.callback,);
//add a function to allso remove the popup when the button is clicked
    this.element.querySelector("button").addEventListener("click", () => {

      this.element.remove();
    } );

    //add the class

    this.element.classList.add("popup");
    //position the popup absolute

    document.getElementById("canvas-holder").appendChild(this.element);


  }

}
/*/create a popup
const popup = new Popup("Game Over", "Restart", () => {
  location.reload();  //reload the page");
});

 */
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
   let ctx = myGame.ctx;
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
    //round to int using bitwise or
    x: x*cos - y*sin | 0,
    y: x*sin + y*cos | 0
  }
}

//spawner
const spawner = {

  enemies : [],
  particleSystems : [],
  count : 0,
  i : 0,
  spawnEnemie: function () {

    let bat = new Bat(0,0,18,180,36,200,"img/Bat.png");
    bat.addCollider(new SphereCollider(20),0,-160);
    let enemy = new Enemy(1500,520,100,250,200,400,"img/metzger.png");
    enemy.addCollider(new SphereCollider(80),10,-20);
    let particle =new ParticleSystem(100,100,1300);
    particle.zIndex = this.i
    enemy.addBlood(particle);
    enemy.equip(bat,-30,-10,-10);
    enemy.zIndex = this.i++;
    myGame.reorganizeGameObjects()
    return enemy;
    } ,

  manageEnemies: function () {
    //create a new enemy every 2 seconds or when there are less than 3 enemies
    if ( this.count>4000&& myGame.enemieCount<3 ){
      //spawn a new enemy
      let enemie = this.spawnEnemie();
      //add collider

      this.enemies[this.i%3] = enemie;
      myGame.enemieCount++;
      this.count = 0;
    }
    this.count += deltaTime;

  }
}


//create a player


//enemy.addChild(particles);

//updateUi()
function animate(){
  //calculate the delta time
  let now = Date.now();
  deltaTime = now - lastTime;
  lastTime = now;
  //spawner.manageEnemies()
  timePassed++;
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  //read the input
  updateGameobjects();

  //set the frame rate to 60fps



  requestAnimationFrame(animate);
}
startGame();
function init() {
  const pigdeath = new sound("sounds/death.wav");
// const hills = new Hills(0,700,0,0,600,300,"img/hill1.png");
  var ground = new GameObject(0,620,0,0,canvas.width,groundheight, "green");
  const player = new Player(200,600,150,250,300,300,"img/Schweindal.png");
  const sword = new Sword(0,0,35,200,70,220,"img/Sword.png");
  const bat = new Bat(0,0,18,180,36,200,"img/Bat.png");
  const enemy = new Enemy(600,520,100,250,200,400,"img/metzger.png");
  const collider = new SphereCollider(50);
  const enemyCollider = new SphereCollider(80);
  const pigParticle = new ParticleSystem(0,0,130);
  player.addBlood(pigParticle,100,-100);
  bat.addCollider(new SphereCollider(20),0,-160);
  enemy.addCollider(enemyCollider,10,-40);
  sword.addCollider(new SphereCollider(10),0,-180);
  const healthbar = new HealthBar(20,15,100,50,200,20);
  player.equip(sword,40,10,95);
  player.addCollider(collider,100,-40 );
  enemy.equip(bat,-30,-10,-10);
  const particles = new ParticleSystem(100,100,1300);
  enemy.addBlood(particles,0,0);

}

//react to key presses


//animate();

