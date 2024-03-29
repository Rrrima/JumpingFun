import * as THREE from '../three/three.module.js';
import Stats from '../three/stats.module.js';
import { GLTFLoader } from '../three/GLTFLoader.js';
import Jumper from './Jumper.js';

export default function Game () {
  // create scene
  const scene = this.scene = new THREE.Scene();
  scene.background = new THREE.Color(0xE5E7E9);
  // create light 
  const light = this.light = new THREE.DirectionalLight(0xeeee22, .5);
  const lightTarget = this.lightTarget = new THREE.Object3D();
  light.target = lightTarget;
  light.position.set(-3,6,8);
  // 开启阴影投射
  light.castShadow = true;
  // 定义可见域的投射阴影
  light.shadow.camera.left = -1000;
  light.shadow.camera.right = 1000;
  light.shadow.camera.top = 1000;
  light.shadow.camera.bottom = -1000;
  light.shadow.camera.near = 0;
  light.shadow.camera.far = 2000;
  // 定义阴影的分辨率
  light.shadow.mapSize.width = 1600;
  light.shadow.mapSize.height = 1600;
  // 环境光
  scene.add(new THREE.AmbientLight(0xE5E7E9, .1));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, .2));
  scene.add(lightTarget);
  scene.add(light);
   //地面
  const planeGeometry = new THREE.PlaneBufferGeometry(10e2, 10e2, 1, 1);
  const planeMeterial = new THREE.MeshLambertMaterial({ color:0x596b44 });
  const plane = new THREE.Mesh(planeGeometry, planeMeterial);
  this.plane = plane;
  
  plane.rotation.x = -.5 * Math.PI;
  // plane.position.y = -.1;
  // 接收阴影
  plane.receiveShadow = true;
  scene.add(plane);
  // scene.add(new THREE.AxesHelper(10e3));
  // create camera
  this.camera = new THREE.OrthographicCamera(window.innerWidth / -8,
    window.innerWidth / 8,
    window.innerHeight / 8,
    window.innerHeight / -8,
    0.1, 1000);
  this.camera.position.set(100, 100, 100);
  this.cameraPos = {
    current: new THREE.Vector3(0, 0, 0), 
    next: new THREE.Vector3() 
  };

  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild( this.renderer.domElement );
  this.canvas = this.renderer.domElement;

  // 灯光
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.1);
  directionalLight.position.set( 3, 10, 15);
  this.scene.add( directionalLight );
  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
  this.scene.add( ambientLight );

  this.config = {
      // 弹跳体参数设置
      jumpTopRadius: 3,
      jumpBottomRadius: 5,
      jumpHeight: 20,
      jumpColor: 0xF56C6C,
      // 立方体参数设置
      cubeX: 40,
      cubeY: 20,
      cubeZ: 40,
      cubeColor: 0xdfdf4a,
      // 圆柱体参数设置
      cylinderRadius: 20,
      cylinderHeight: 20,
      cylinderColor: 0xdfdf4a,
      // 设置缓存数组最大缓存多少个图形
      cubeMaxLen: 6,
      // 立方体内边缘之间的最小距离和最大距离
      cubeMinDis: 25,
      cubeMaxDis: 40
   };

   this.mouse = {
     down: this.isPC() ? 'mousedown' : 'touchstart',
     up: this.isPC() ? 'mouseup' : 'touchend'
   };

   this.cubes = [];
   this.jumper = null;

   // mousedown : -1
   // mouseup : 1
   this.mouseState = 0;
   this.xspeed = 0;
   this.yspeed = 0;
   this.score = 0;

   this._initScore();

   this.failCallback = function(){};

}

Game.prototype.constructor = Game;

Object.assign(Game.prototype, {

  // 随机产生一个图形
  createCube: function (){
    var relativePos = Math.random() > 0.5 ? 'zDir' : 'xDir';
    // var relativePos = 'xDir';
    var cubeType = Math.random() > 0.5 ? 'cube' : 'cylinder';

    var geometry = cubeType === 'cube' ?
    new THREE.CubeGeometry(this.config.cubeX, this.config.cubeY, this.config.cubeZ):
    new THREE.CylinderGeometry(this.config.cylinderRadius, this.config.cylinderRadius, this.config.cylinderHeight, 100);
    // var color = cubeType === 'cube' ? this.config.cubeColor : this.config.cylinderColor;
    var materials = cubeType === 'cube' ?[ 
     new THREE.MeshLambertMaterial( { map:new THREE.TextureLoader().load("imgs/jump_trunk.jpg") } ), // right
     new THREE.MeshLambertMaterial( { color: 0x38250d } ), // left
     new THREE.MeshLambertMaterial( { map:new THREE.TextureLoader().load("imgs/jump_trunk_top.jpg") } ), // top
     new THREE.MeshLambertMaterial( { color:'black'} ), // bottom 
     new THREE.MeshLambertMaterial( { map:new THREE.TextureLoader().load("imgs/jump_trunk.jpg") } ), // front 
     new THREE.MeshLambertMaterial( { color: 0x38250d } ), // back
    ]:[
     new THREE.MeshLambertMaterial( { map:new THREE.TextureLoader().load("imgs/jump_trunk_round.jpg") } ), // side
     new THREE.MeshLambertMaterial( { map:new THREE.TextureLoader().load("imgs/jump_trunk_top_round.jpg") } ), // top
     new THREE.MeshLambertMaterial( { color:'black'}), // bottom
    ]; 
    var cubeSidesMaterial = new THREE.MultiMaterial( materials );
    // var material = new THREE.MeshLambertMaterial( { map: texture } );
    // var mesh = new THREE.Mesh(geometry, material);
    var mesh = new THREE.Mesh(geometry, cubeSidesMaterial);
    mesh.castShadow=true;
    mesh.receiveShadow=true;

    // 产生随机图形
    if (this.cubes.length){
      var dis = this.getRandomValue(this.config.cubeMinDis, this.config.cubeMaxDis);
      var lastcube = this.cubes[this.cubes.length - 1];
      if (relativePos === 'zDir'){
        if (cubeType === 'cube'){
          if (lastcube.geometry instanceof THREE.CubeGeometry)
            // 方体 -> 方体
            mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cubeZ );
          else  // 方体 -> 圆柱体
            mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2);
        } else {
          if (lastcube.geometry instanceof THREE.CubeGeometry)
             // 圆柱体 -> 方体
             mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2);
          else
            // 圆柱体 -> 圆柱体
             mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z -  dis - this.config.cylinderRadius * 2 );
        }
      } else {
        if (cubeType === 'cube'){
          if (lastcube.geometry instanceof THREE.CubeGeometry)
            // 方体 -> 方体
            mesh.position.set(lastcube.position.x + dis + this.config.cubeX, lastcube.position.y, lastcube.position.z);
          else  // 方体 -> 圆柱体
            mesh.position.set(lastcube.position.x + dis + this.config.cubeX / 2 + this.config.cylinderRadius, lastcube.position.y, lastcube.position.z);
        } else {
          if (lastcube.geometry instanceof THREE.CubeGeometry)
             // 圆柱体 -> 方体
             mesh.position.set(lastcube.position.x + dis + this.config.cylinderRadius + this.config.cubeX / 2 , lastcube.position.y, lastcube.position.z);
          else
            // 圆柱体 -> 圆柱体
             mesh.position.set(lastcube.position.x + dis + this.config.cylinderRadius * 2, lastcube.position.y, lastcube.position.z);
        }
      }
    } else {
      mesh.position.set(0, 0, 0);
    }
    
    this.testPosition(mesh.position);
    this.cubes.push(mesh);
    this.scene.add(mesh);
    this._render();
    // 如果缓存图形数大于最大缓存数，去掉一个
    if (this.cubes.length > this.config.cubeMaxLen){
      this.scene.remove(this.cubes.shift());
    }
    if (this.cubes.length > 1){
      // 更新相机位置
      this._updateCameraPos();
    } else {
      this.camera.lookAt(this.cameraPos.current);
    }
  },

  // 创建一个弹跳体
  createJumper: function (){
    var color = this.config.jumpColor;
    var world = this;
    this.littleman = new Jumper({color,world});
    var mesh = this.littleman.body;
    this.littleman.enterStage(0, this.config.jumpHeight / 2, 0);
    this.jumper = mesh;
  },

  _render: function (){
    this.renderer.render(this.scene, this.camera);
  },

  _updateCameraPos: function (){
    var a = this.cubes[this.cubes.length - 2];
    var b = this.cubes[this.cubes.length - 1];
    var toPos = {
      x: ( a.position.x + b.position.x ) / 2,
      y: 0,
      z: ( a.position.z + b.position.z ) / 2
    };
    this.cameraPos.next = new THREE.Vector3(toPos.x, toPos.y, toPos.z);
    this._updateCamera();
  },

  _updateCamera: function (){
    var self = this;
    var c = {
      x: self.cameraPos.current.x,
      y: self.cameraPos.current.y,
      z: self.cameraPos.current.z
    };
    var n = {
      x: self.cameraPos.next.x,
      y: self.cameraPos.next.y,
      z: self.cameraPos.next.z
    };
    var dif=new THREE.Vector3(n.x-c.x,0,n.z-c.z);
    if (c.x < n.x || c.z > n.z) {
      if ( c.x < n.x ) {
        self.cameraPos.current.x += 1;
        self.camera.position.x+=1;
        self.plane.position.x+=1;
      }
      if (c.z > n.z) {
        self.cameraPos.current.z -= 1;
        self.camera.position.z-=1;
        self.plane.position.z-=1;
      }
      if ( Math.abs(self.cameraPos.current.x - self.cameraPos.next.x) < 0.5) {
        self.cameraPos.current.x = self.cameraPos.next.x;
      }
      if ( Math.abs(self.cameraPos.current.z - self.cameraPos.next.z) < 0.5) {
        self.cameraPos.current.z = self.cameraPos.next.z;
      }
      self.camera.lookAt(new THREE.Vector3(c.x, 0, c.z));
      self._render();
      requestAnimationFrame(function(){
        self._updateCamera();
      });
    }
  },

  _registerEvent: function (){
    this.canvas.addEventListener(this.mouse.down, this._onMouseDown.bind(this));
    this.canvas.addEventListener(this.mouse.up, this._onMouseUp.bind(this));
    window.addEventListener('resize', this._onwindowResize.bind(this), false);
  },

  _destoryEvent: function (){
    this.canvas.removeEventListener(this.mouse.down, this._onMouseDown.bind(this));
    this.canvas.removeEventListener(this.mouse.up, this._onMouseUp.bind(this));
    window.removeEventListener('resize', this._onwindowResize.bind(this), false);

  },

  _onwindowResize: function (){
    this.camera.left = window.innerWidth / -2;
    this.camera.right = window.innerWidth / 2;
    this.camera.top = window.innerHeight / 2;
    this.camera.bottom = window.innerHeight / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  _onMouseDown: function (){
    var curbox = this.cubes[this.cubes.length - 2];
    this.mouseState = -1;
    this.littleman.particle.runParticleFlow();
    this.littleman.particle.runParticleFountain();
    if (this.jumper.scale.y > 0.6){ // 控制一个域值，防止缩放时底面也进行缩放
      this.jumper.scale.y -= 0.01;
      curbox.scale.y -= 0.002;
      this.xspeed += 0.04; // 水平方向运动加速度
      this.yspeed += 0.08; // 垂直方向运动加速度
      this._render();
      requestAnimationFrame(function (){
        if (this.mouseState === -1) this._onMouseDown();
      }.bind(this));
    }
  },

  _onMouseUp: function (){
    var curbox = this.cubes[this.cubes.length - 2];
    var self  = this;
    this.littleman.particle.stopRunParticleFlow();
    this.mouseState  = 1;
    this.flip = 1;
    if (this.jumper.position.y >= this.config.jumpHeight / 2){
      // jumper还在空中运动
      var dir = this.getDirection();
      if (dir === 'x'){
        this.jumper.position.x += this.xspeed;
        this.jumper.position.y += this.yspeed;
      } else {
        this.jumper.position.z -= this.xspeed;
        this.jumper.position.y += this.yspeed;
      }
      this._render();
      // 垂直方向先上升后下降
      this.yspeed -= 0.1;
      console.log(this.yspeed)
      // jumper要恢复
      if (this.yspeed>2.5 && this.yspeed<2.6 && this.flip){
        // flip
        console.log("eligible to flip");
        this.littleman.flip(430,dir==='x');
        this.flip = 0;
      }
      if (this.jumper.scale.y < 1){
        this.jumper.scale.y += 0.2;
      }
      if (curbox.scale.y < 1){
        curbox.scale.y += 0.03;
      }
      requestAnimationFrame(function (){
        this._onMouseUp();
      }.bind(this));
    } else {
      // jumper降落了
      var type = this.getJumpState();
      console.log('jumpstate:' + type);
      console.log('mousestate:' + this.mouseState);
      if (type === 1){
        // 落在当前块上
        this.xspeed = 0;
        this.yspeed = 0;
        this.jumper.scale.y = 1;
        this.jumper.position.y = this.config.jumpHeight / 2;
      } else if(type === 2 || type === 3){
        // 成功降落
         this.score += 1;
         this.xspeed = 0;
         this.yspeed = 0;
         this.jumper.scale.y = 1;
         this.jumper.position.y = this.config.jumpHeight / 2;
         this._updateScore();
         this.createCube();
      } else if (type === -2){
        // 落到大地上动画
        (function continuefalling () {
          
          if (self.jumper.position.y >= 0){
            self.jumper.position.y -= 0.8;
            var scaleY=self.jumper.scale.y;
            self.jumper.scale.y -=scaleY>1? .025:0;
            self._render();
            requestAnimationFrame(continuefalling);
          }
        })();
        if (this.failCallback) {
          setTimeout(function(){
            self.failCallback(self.score);
          }, 1000);
        }
      } else {
        // 落到边缘处
        this.failingAnimation(type);
        if (this.failCallback) {
          setTimeout(function(){
            self.failCallback(self.score);
          }, 1000);
        }
      }
    }
  },

  _initScore: function (){
    document.getElementById("current_score").innerHTML="0";
  },

  _updateScore: function (){
    document.getElementById('current_score').innerHTML = this.score;
  },

  start: function() {
    this.camera.position.set(100,100,100);
    this.plane.position.set(0,0,0);
    this.createCube();
    this.createCube();
    this.createJumper();
    this._registerEvent();
    this._updateScore();
  },

  restart: function (){
    for (var i = 0, len = this.cubes.length; i < len; i++){
      this.scene.remove(this.cubes[i]);
    }
    this.scene.remove(this.jumper);
    this.camera.position.set(100,100,100);
    this.plane.position.set(0,0,0);
    this.cameraPos = {
      current: new THREE.Vector3(0, 0, 0), // 摄像机当前的坐标
      next: new THREE.Vector3() // 摄像机即将要移到的位置
    };
    this.cubes = [];
    this.jumper = null;
    this.mouseState = 0;
    this.xspeed = 0;
    this.yspeed = 0;
    this.score = 0;

    this.createCube();
    this.createCube();
    this.createJumper();
    this._updateScore();
  },

  getRandomValue: function (min, max){
    // min <= value < max
    return Math.floor(Math.random() * (max - min)) + min;
  },

  failingAnimation: function (state){
     var rotateAxis = this.getDirection() === 'z' ? 'x' : 'z';
     var rotateAdd, rotateTo;
     if (state === -1){
       rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
       rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
     } else {
       rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
       rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
     }
     if (rotateTo){
       this.jumper.rotation[rotateAxis] = rotateAdd;
       this._render();
       requestAnimationFrame(function (){
         this.failingAnimation(state);
       }.bind(this));
     } else {
       var self  = this;
       (function continuefalling () {
         if (self.jumper.position.y >= 0){
           self.jumper.position.y -= speed;
           var scaleY=self.jumper.scale.y;
            self.jumper.scale.y -=scaleY>1? .025:0;
           self._render();
           console.log("falling!");
           requestAnimationFrame(continuefalling);
         }
       })();
     }
  },

  /*
  * 根据落点判断是否成功或失败，共分为以下几种情况
  * 返回值 1： 成功，但落点仍然在当前块上
  * 返回值 2： 成功，落点在下一个块上
  * 返回值 3： 成功，落点在中心点 （先不考虑，后续优化）
  * 返回值 -1：失败，落点在当前块边缘 或 在下一个块外边缘
  * 返回值 -2：失败，落点在当前块与下一块之间 或 在下一个块之外
  * 返回值 -3：失败，落点在下一个块内边缘
   */
  getJumpState: function (){
      var jumpR = this.config.jumpBottomRadius;
      var vard = this.getd();
      var d = vard.d;
      var d1 = vard.d1;
      var d2 = vard.d2;
      var d3 = vard.d3;
      var d4 = vard.d4;
      if (d <= d1) {
        return 1;
      }  else if (d > d1 && Math.abs(d - d1) <= jumpR) {
        return -1;
      } else if (Math.abs(d - d1) > jumpR && d < d2 && Math.abs(d - d2) >= jumpR){
        return -2;
      } else if ( d < d2 && Math.abs(d - d2) < jumpR){
        return -3;
      } else if ( d > d2 && d <= d4){
        return 2;
      } else if ( d > d4 && Math.abs(d - d4) < jumpR){
        return -1;
      } else {
        return -2;
      }
  },

  getd: function (){
    var d, d1, d2, d3, d4;
    var fromObj = this.cubes[this.cubes.length - 2];
    var fromPosition = fromObj.position;
    var fromType = fromObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
    var toObj = this.cubes[this.cubes.length - 1];
    var toPosition = toObj.position;
    var toType = toObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
    var jumpObj = this.jumper;
    var position = jumpObj.position;

    if (fromType === 'cube'){
       if (toType === 'cube'){
           if ( fromPosition.x === toPosition.x ){
             // -z 方向
             d = Math.abs(position.z);
             d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
             d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
             d3 = Math.abs(toPosition.z);
             d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
           } else {
             // x 方向
             d = Math.abs(position.x);
             d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
             d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
             d3 = Math.abs(toPosition.x);
             d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
           }
       } else {
         if ( fromPosition.x === toPosition.x ){
           // -z 方向
           d = Math.abs(position.z);
           d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
           d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
           d3 = Math.abs(toPosition.z);
           d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
         } else {
           // x 方向
           d = Math.abs(position.x);
           d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
           d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
           d3 = Math.abs(toPosition.x);
           d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
         }
       }
    } else {
      if (toType === 'cube'){
        if ( fromPosition.x === toPosition.x ){
          // -z 方向
          d = Math.abs(position.z);
          d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
          d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
          d3 = Math.abs(toPosition.z);
          d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
        } else {
          // x 方向
          d = Math.abs(position.x);
          d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
          d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
          d3 = Math.abs(toPosition.x);
          d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
        }
      } else {
        if ( fromPosition.x === toPosition.x ){
          // -z 方向
          d = Math.abs(position.z);
          d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
          d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
          d3 = Math.abs(toPosition.z);
          d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
        } else {
          // x 方向
          d = Math.abs(position.x);
          d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
          d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
          d3 = Math.abs(toPosition.x);
          d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
        }
      }
    }

    return {d: d, d1: d1, d2: d2, d3: d3, d4: d4};
  },

  getDirection: function (){
    var direction;
    if (this.cubes.length > 1){
      var from = this.cubes[this.cubes.length - 2];
      var to = this.cubes[this.cubes.length - 1];
      if (from.position.z === to.position.z) direction = 'x';
      if (from.position.x === to.position.x) direction = 'z';
    }
    return direction;
  },

  testPosition: function (position){
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)){
      console.log('position incorrect！');
    }
  },

 isPC: function() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
                "SymbianOS", "Windows Phone",
                "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
  }
});
