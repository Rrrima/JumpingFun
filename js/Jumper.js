import * as THREE from '../three/three.module.js';
import TWEEN from './tween.cjs.js';
import {animate} from './util.js';
import Particle from './particle.js'

export default class Jumper {
	constructor ({
		world,
		color,
	}) {
		this.world = world;
		this.width = 120;
	    this.color = color;
	    this.G = 9.8;
	    this.v0 = 80;
	    this.theta = 90;

	    this.headSegment = null;
	    this.bodyScaleSegment = null;
	    this.bodyRotateSegment = null;
	    this.body = null;

	    this.unbindFunc = null;
	    this.currentProp = null;
	    this.nextProp = null;
	    this.powerStorageDuration = 1500;

	    this.stage = world.scene;

	    this.createBody();
	    this.particle = new Particle({
	      triggerObject: this.body,
	      world
	    })
	    console.log(this.particle);
	};

	createBody () {
	    const { color, width } = this;
	    // console.log("inside construction",color,width);
	    //const material = new THREE.MeshLambertMaterial( { color: color } );
	    //material.setValues({color});
	    const material= new THREE.MeshLambertMaterial( { color: 0xf25f5c } )
	    // head
	    const headSize = this.headSize = width * .04;
	    const headTranslateY = this.headTranslateY = headSize * 2.2;
	    const headTopGeometry = new THREE.SphereGeometry(headSize, 16, 16);
	    headTopGeometry.translate(0, headSize*0.25, 0);
	    const headBottomGeometry = new THREE.CylinderBufferGeometry(headSize * .87, headSize * 1.73, headSize * 1.5, 16);
	    headBottomGeometry.translate(0, 0, 0);
	    
	    const headGeometry = new THREE.Geometry();
	    headGeometry.merge(headTopGeometry);
	    headGeometry.merge(new THREE.Geometry().fromBufferGeometry(headBottomGeometry));
	    const headSegment = this.headSegment = new THREE.Mesh(headGeometry, material);
	    headSegment.castShadow = true;
	    headSegment.translateY(headTranslateY);

	    // body
	    this.width = headSize * 1.2 * 2;
	    this.height = headSize * 5;
	    this.bodySize = headSize * 4;
	    const bodyBottomGeometry = new THREE.CylinderBufferGeometry(headSize * 0.71, headSize * .56, headSize * .3, 16);
	    bodyBottomGeometry.translate(0, headSize * .15, 0);
	    const bodyCenterGeometry = new THREE.SphereGeometry(headSize, 16, 16);
	    bodyCenterGeometry.translate(0, headSize * .86, 0);
	    const bodyTopGeometry = new THREE.CylinderBufferGeometry(headSize * .43, headSize * .87, headSize * 1.5, 16);
	    bodyTopGeometry.translate(0, headSize * 2.10, 0);

	    const bodyGeometry = new THREE.Geometry();
	    bodyGeometry.merge(bodyCenterGeometry);
	    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyTopGeometry));
	    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyBottomGeometry));
	    var materialBody = new THREE.MeshLambertMaterial( { color: 0xd1b8be } );
	    // scale control
	    const translateY = this.bodyTranslateY = headSize * 1.5;
	    const bodyScaleSegment = this.bodyScaleSegment = new THREE.Mesh(bodyGeometry, materialBody);
	    bodyScaleSegment.castShadow = true;
	    bodyScaleSegment.translateY(-translateY);

	    // rotate control
	    const bodyRotateSegment = this.bodyRotateSegment = new THREE.Group();
	    bodyRotateSegment.add(headSegment);
	    bodyRotateSegment.add(bodyScaleSegment);
	    bodyRotateSegment.translateY(translateY);

	    const body = this.body = new THREE.Group();
	    body.add(bodyRotateSegment);
	  };

	bindEvent() {
		const { world } = this;
		const container = world.canvas;
		const mouseup = () => {
			if (this.jumping) {
				return;
			}
			this.jumping = true;
			this.poweringUp = false;
			this.jump();
			container.removeEventListener(world.mouse.down, mouseup);
		}
		const mousedown = event => {
	      event.preventDefault()
	      if (this.poweringUp || this.jumping || !this.currentProp) {
	        return;
	      }
	      this.poweringUp = true;
	      this.powerStorage();
	      container.addEventListener(world.mouse.up, mouseup, false);
	    }
	    container.addEventListener(world.mouse.down, mousedown, false);
	};

	enterStage(x, y, z) {
	    const { body,stage,world } = this;
	    body.position.set(x, y, z);
	    // this.nextProp = nextProp
	    stage.add(body);
	    world._render();
	    this.bindEvent();
  	};

	flip (duration, direction) {
	    const { bodyRotateSegment } = this;
	    let increment = 0;
	    animate(
	      {
	        from: { deg: 0 },
	        to: { deg: 360 },
	        duration,
	        easing: TWEEN.Easing.Sinusoidal.InOut
	      },
	      ({ deg }) => {
	        if (direction) {
	          bodyRotateSegment.rotateZ(-(deg - increment) * (Math.PI/180))
	        } else {
	          bodyRotateSegment.rotateX(-(deg - increment) * (Math.PI/180))
	        }
	        increment = deg
	      }
	    )
	  }


};

