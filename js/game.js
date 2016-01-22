// Create the canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.width = 640;
canvas.height = 480;
var modifier = 0;
// init game vars
var blockSize = 32;
var rows = Math.ceil(canvas.height / blockSize) + 2;
var cols = Math.ceil(canvas.width / blockSize);
var pX = Math.floor(canvas.width/2);
var pY = Math.floor((rows*blockSize)-(blockSize*6));
var playerFade = 1.0;
var playerFadeIn = false;
var startSpeed = 1.0;
var speed = startSpeed;
var pixelPerSecond = 256;
var wallSize = Math.floor((canvas.width/blockSize)/3);
var minWallSize = 0.5;
var maxWallSize = 0.5;
var wallX = Math.floor(((canvas.width / blockSize)/2) - (wallSize/2));
var offset = 0;
var level = [];
for (i = 0; i < cols; i++){ level[i] = new Array(rows); }
for (row = 0; row < rows; row++){ for (col = 0; col < cols; col++){ level[row][col] = new Tile(0,getRandomInt(0, 25),0,0);}}
var fume = [];
var maxFumeTick = 10;
var fumeTick = maxFumeTick;
var intro = true;
var introFade = 0;
var introFadeOut = false;
var lowGraphics = false;
var start = false;
var pause = false;
var gameOver = false;
var pauseMusic = false;
var bestTime = 0;
var sTime = 0;
var eTime = 0;
var pTime = 0;
var time = 0;


// texture(s)
var jet = new Image();
var overlays = new Image();
var board = new Image();
var instructions = new Image();
var logo = new Image();
overlays.src = "img/overlays.png";
jet.src = "img/jet.png";
board.src = "img/board.png";
instructions.src = "img/instructions.png";
logo.src = "img/logo.png";
//audio
var pop = new Audio("sounds/pop.wav");
var alive = new Audio("sounds/alive.wav")
var introSound = new Audio("sounds/introSound.wav");
introSound.play();

alive.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
//event listeners
addEventListener("keydown", function (e) {
	var key = e.keyCode;
	if (!intro){
		if (key == 27){
			reset();
			intro = true;
			gameOver = start = pause = false;
			alive.pause();
			alive.currentTime = 0;
			introSound.play();
		}
		else if (key == 71) lowGraphics = !lowGraphics; //toggle graphics
		else if (key == 77) pauseTheMusic();
	}
	return false;
}, false);
addEventListener("keyup", function (e) {
	var key = e.keyCode;
	return false;
}, false);
addEventListener("mousedown", function (e) {
	//checkXY(e);
	return false;
}, false);
addEventListener("mouseup", function (e) {
	//checkXY(e);
	if (intro){
		introFade = 0;
		intro = false;
		start = true;
		introSound.pause();
		introSound.currentTime = 0;
		alive.play();
	}
	else{
		if (gameOver && !start) reset();
		else{
			if (!start) pauseGame();
			else{
				start = false;
				canvas.style.cursor = "none";
			}
		}
	}
	return false;
}, false);
addEventListener("mousemove", function (e) {
	checkXY(e);
	return false;
}, false);
function Tile(type, r, g, b){
	this.type=type;
	this.r=r;
	this.g=g;
	this.b=b;
	this.minFlash = 0;
	this.maxFlash = 125;
	this.flashUp = true;
}
Tile.prototype.flash = function(){
	if (this.r > 175){
		if (this.flashUp){
			this.g += (0.3)*modifier;
			this.b += (0.3)*modifier;
			if (this.g >= this.maxFlash || this.b >= this.maxFlash) this.flashUp = false;
		}
		else {
			this.g -= (0.3)*modifier;
			this.b -= (0.3)*modifier;
			if (this.g <= this.minFlash || this.b <= this.minFlash) this.flashUp = true;
		}
	}
}
function drawTiles(){
	for (var row = 0; row < rows; row++){
		for (var col = 0; col < cols; col++){
			if (level[row][col].type ==1 || !lowGraphics) level[row][col].draw(row,col);
		}
	}
}
Tile.prototype.draw = function(row, col){
	if (this.type >= 0){
		this.flash();
		ctx.fillStyle = "rgb("+Math.floor(this.r)+", "+Math.floor(this.g)+", "+Math.floor(this.b)+")";
		ctx.fillRect(col*blockSize+0.1, Math.floor((row*blockSize)+offset-(blockSize*2))+0.1, blockSize, blockSize);
	}
}
Tile.prototype.setTile = function(tile){ this.type = tile.type; this.r = tile.r; this.g = tile.g; this.b = tile.b; }
Tile.prototype.setTRGB = function(type,r,g,b){ this.type=type; this.r=r; this.g=g;this.b=b; }
Tile.prototype.setWallColors = function(){
	this.r = getRandomInt(125, 200);
	this.g = 0;
	this.b = 0;
}
Tile.prototype.setBackgroundColors = function(){
	this.r = getRandomInt(0, 25);
	this.g = 0;
	this.b = 0;
}
function Fume(x,y){
	this.x = x;
	this.y = y;
	this.y = pY + 16 + Math.floor(Math.random()*16);
	this.r = 255;
	this.g = 255;
	this.b = 0;
	this.direction = (Math.random()*0.3) - (Math.random()*0.3);
	this.size = Math.floor(Math.random()*4)+1;
	this.active = true;
}
function drawFumes(){
	for (var i = 0; i < fume.length; i++) fume[i].draw();
}
Fume.prototype.draw = function(){
	if (this.y < canvas.height + this.size/2){
		this.y += (speed*modifier*1.5);
		this.x += this.direction*modifier;
		if (this.r > this.b) this.r -= (modifier*8);
		if (this.g > this.b) this.g -= (modifier*8);
		if (this.b < this.r) this.b += (modifier*2);
		this.size += (modifier*0.4);
		ctx.fillStyle = "rgb("+Math.floor(this.r)+", "+Math.floor(this.g)+", "+Math.floor(this.b)+")";
		ctx.fillRect(Math.floor(this.x - (this.size/2)), Math.floor(this.y - (this.size/2)),
			     Math.floor(this.size), Math.floor(this.size));
	}
	else this.active = false;
}
function removeFume(index){ fume.splice(index,1); }
function checkFumes(){
	if (fumeTick > 0) fumeTick -= 1*modifier;
	else{
		fume.push(new Fume(pX-30,pY+20));
		fume.push(new Fume(pX+30,pY+20));
		fumeTick = maxFumeTick;
	}
	for (var i = 0; i < fume.length; i++){
		if (!fume[i].active){
			removeFume(i);
		}
	}
}
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function checkXY(e){
	//set x and y from mouse
	if (!pause && !gameOver && !start && !intro){
		x = 0;
		y = 0;
		if (e.x != undefined && e.y != undefined){
			x = e.x;
			y = e.y + window.pageYOffset;
		}
		else{ //fix mozilla issue
			x = e.clientX + document.body.scrollLeft +
				document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop +
				document.documentElement.scrollTop;
		}
		x -= canvas.offsetLeft;
		y -= canvas.offsetTop;
		if (x >= 0 && x < canvas.width) pX = x;
	}
}
// Update game objects
function update(){
	if (!pause && !gameOver && !start && !intro){
		//update stuff like enemies etc.
		checkCollision();
		checkFumes();
		offset += (speed*modifier);
		if (offset > blockSize){
			while (offset > blockSize){
				offset -= blockSize;
				spawnColumn();
			}
		}
		//speed up
		speed += (.0001)*modifier;
		//adjust time
		if (sTime == 0) sTime = Date.now();
		eTime = Date.now();
		time = Math.floor((eTime - sTime)/1000);
	}
}
function pauseGame(){
	if (gameOver || start){
		pause = false;
		//document.getElementById("canvas").style.cursor = "default";
	}
	else{
		if (pause) {
			pause = false; sTime += (Date.now() - pTime);
			canvas.style.cursor = "none";
		}
		else{
			pause = true; pTime = Date.now();
			canvas.style.cursor = "default";
		}
	}
}
function pauseTheMusic() {
		if (pauseMusic){
			alive.play();
			pauseMusic = false;
		}
		else {
			alive.pause();
			pauseMusic = true;
		}
	}
// Draw everything
function render() {
	//draw background
	ctx.globalAlpha = 1.0;
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	if (intro){
		if (!introFadeOut){
			if (introFade + (modifier*0.0015) < 1) introFade += (modifier*0.0015);
			else{
				introFade = 1.0;
				introFadeOut = true;
			}
		}
		else{
			if (introFade - (modifier*0.0015) > 0) introFade -= (modifier*0.0015);
			else{
				introFade = 0;
				introFadeOut = false;
				intro = false;
				start = true;
				introSound.pause();
				introSound.currentTime = 0;
				alive.play();
			}
		}
		ctx.globalAlpha = introFade;
		ctx.drawImage(logo, (canvas.width/2)-(logo.width/2),(canvas.height/2)-(logo.height/2));
	}
	else{
		//draw level
		drawTiles();
		//draw text
		if (!pause){
			ctx.drawImage(board, 0,0);
			ctx.font = "16px Arial Black, Arial Black, Gadget, sans-serif";
			ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
			ctx.shadowOffsetX = 0; // Sets the shadow offset x, positive number is right
			ctx.shadowOffsetY = 2; // Sets the shadow offset y, positive number is down
			ctx.shadowBlur = 0; // Sets the shadow blur size
			ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'; // Sets the shadow color
			ctx.fillText("Best Time: "+bestTime,10,18);
			ctx.fillText("Time: "+time,10,36);
		}
		//draw player
		if (!gameOver){
			drawFumes();
			if (start || pause){
				if (playerFadeIn){
					if (playerFade + (modifier*0.015) < 1.0) playerFade += (modifier*0.015);
					else playerFadeIn = false;
				}
				else{
					if (playerFade - (modifier*0.015) > 0) playerFade -= (modifier*0.015);
					else playerFadeIn = true;
				}
				ctx.globalAlpha = playerFade;
			}
			ctx.drawImage(jet,pX-32, pY-32);
			ctx.globalAlpha = 1.0;
			console.log(playerFade);
		}
		else ctx.drawImage(overlays, 0, 256, 256, 128, 192, 126, 256, 128);
		if (start){
			ctx.drawImage(overlays, 0, 0, 256, 128, 192, 126, 256, 128);
			ctx.drawImage(instructions, canvas.width-instructions.width, canvas.height-instructions.height);
		}
		if (pause) ctx.drawImage(overlays, 0, 128, 256, 128, 192, 126, 256, 128);
	}
};
// The main game loop
function main() {
	var now = Date.now();
	delta = now - then;
	
	modifier = (delta/1000)*pixelPerSecond;
	update(); //update stuff like enemies
	render(); //this is where everything is drawn
	
	then = now;
};
var then = Date.now();
setInterval(main, 1); // Execute as fast as possible
function spawnColumn(){
	//move each row
	for (var row = rows - 1; row > 0; row--){
		for (var col = 0; col < cols; col++){
			level[row][col].setTile(level[row-1][col]);
		}
	}
	//change wall size
	wallSize += (Math.floor(Math.random()*3)-1);
	if (wallSize < minWallSize*10) wallSize = minWallSize*10;
	if (wallSize > Math.floor((canvas.width/blockSize)*maxWallSize)) wallSize = Math.floor((canvas.width/blockSize)*maxWallSize);
	//spawn wall
	wallX += Math.floor((Math.random()*3)-1);
	if (wallX < 1) wallX = 1;
	if (wallX + wallSize > cols - 1) wallX = cols - wallSize - 1;
	if (!lowGraphics){
		for (var i = 0; i < cols; i++){
			level[0][i].type = 1;
			level[0][i].setWallColors();
		}
		for (var i = wallX; i < wallSize + wallX; i++){
			level[0][i].type = 0;
			level[0][i].setBackgroundColors();
		}
	}
	else{
		for (var i = 0; i < cols; i++) level[0][i].setTRGB(2,getRandomInt(125, 200),0,0);
		for (var i = wallX; i < wallSize + wallX; i++) level[0][i].setTRGB(0,getRandomInt(0, 25),0,0);
		
		level[0][wallX-1].setTRGB(1,getRandomInt(125, 200),0,0);
		level[0][wallX + wallSize].setTRGB(1,getRandomInt(125, 200),0,0);
		if (wallX > 1) level[0][wallX-2].setTRGB(1,getRandomInt(125, 200),0,0);
		if (wallX + wallSize < cols -1) level[0][wallX + wallSize + 1].setTRGB(1,getRandomInt(125, 200),0,0);
	}
	//repair wall
	for (var col = 1; col < cols - 1; col++){
		if (level[0][col].type == 1 && level[1][col].type == 0 && level[2][col].type == 1) level[1][col].setTRGB(1,getRandomInt(125, 200),0,0);
		if (level[0][col].type == 0 && level[1][col].type == 1 && level[2][col].type == 0) level[1][col].setTRGB(0,getRandomInt(0, 25),0,0);
	}
}
function checkCollision(){
	if (level[Math.floor((pY+offset+blockSize)/blockSize)][Math.floor((pX)/blockSize)].type > 0){
		level[Math.floor((pY+offset+blockSize)/blockSize)][Math.floor((pX)/blockSize)].setTRGB(1,255,0,255);
		canvas.style.cursor = "default";
		gameOver = true;
	}
}
function reset(){
	canvas.style.cursor = "default";
	speed = startSpeed;
	offset = 0;
	gameOver = pauseMusic = false;
	pX = Math.floor(canvas.width/2);
	pY = Math.floor((rows*blockSize)-(blockSize*6));
	start = true;
	wallSize = Math.floor((canvas.width/blockSize)/3);
	wallX = Math.floor(((canvas.width / blockSize)/2) - (wallSize/2));
	if (time > bestTime) bestTime = time;
	sTime = eTime = pTime = 0;
	for (var row = 0; row < rows; row++){
		for (var col = 0; col < cols; col++){
			level[row][col].setTRGB(0,getRandomInt(0, 25),0,0);
		}
	}
	//remove fumes
	fume = [];
}