import * as THREE from '../three/three.module.js';

export default class Jumper {
	constructor ({
		color
	}) {
		this.width = 15;
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

	    this.stage = null;

	    this.createBody();
	};

	  createBody () {
	    const { color, width } = this;
	    console.log("inside construction",color,width);
	    const material = new THREE.MeshLambertMaterial( { color: color } );
	    material.setValues({color});

	    // head
	    const headSize = this.headSize = width * .03;
	    const headTranslateY = this.headTranslateY = headSize * 4.5;
	    const headGeometry = new THREE.SphereGeometry(headSize, 16, 16);
	    const headSegment = this.headSegment = new THREE.Mesh(headGeometry, material);
	    headSegment.castShadow = true;
	    headSegment.translateY(headTranslateY);

	    // body
	    this.width = headSize * 1.2 * 2;
	    this.height = headSize * 5;
	    this.bodySize = headSize * 4;
	    const bodyBottomGeometry = new THREE.CylinderBufferGeometry(headSize * .9, this.width / 2, headSize * 2.5, 16);
	    bodyBottomGeometry.translate(0, headSize * 1.25, 0);
	    const bodyCenterGeometry = new THREE.CylinderBufferGeometry(headSize, headSize * .9, headSize, 16);
	    bodyCenterGeometry.translate(0, headSize * 3, 0);
	    const bodyTopGeometry = new THREE.SphereGeometry(headSize, 16, 16);
	    bodyTopGeometry.translate(0, headSize * 3.5, 0);

	    const bodyGeometry = new THREE.Geometry();
	    bodyGeometry.merge(bodyTopGeometry);
	    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyCenterGeometry));
	    bodyGeometry.merge(new THREE.Geometry().fromBufferGeometry(bodyBottomGeometry));

	    // scale control
	    const translateY = this.bodyTranslateY = headSize * 1.5;
	    const bodyScaleSegment = this.bodyScaleSegment = new THREE.Mesh(bodyGeometry, material);
	    bodyScaleSegment.castShadow = true;
	    bodyScaleSegment.translateY(-translateY);

	    // rotate control
	    const bodyRotateSegment = this.bodyRotateSegment = new THREE.Group();
	    bodyRotateSegment.add(headSegment);
	    bodyRotateSegment.add(bodyScaleSegment);
	    bodyRotateSegment.translateY(translateY);

	    // 整体身高 = 头部位移 + 头部高度 / 2 = headSize * 5
	    const body = this.body = new THREE.Group();
	    body.add(bodyRotateSegment);
	  };
};

