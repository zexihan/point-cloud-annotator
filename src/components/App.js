import React, { Component } from 'react';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

var scene, camera, controls, stats, renderer, loader;

class App extends Component {
  componentDidMount() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    
    //ADD SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    
    //ADD CAMERA
    camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      1,
      1000
    );
    camera.position.x = 0;
    camera.position.y = 0;
		camera.position.z = 0;
    camera.up.set( 0, 0, 1 );
    scene.add(camera);

    //ADD RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    this.mount.appendChild(renderer.domElement);

    //ADD PCDLOADER
    loader = new PCDLoader();
    loader.load( './data/pcd/000015.pcd', function ( points ) {
      points.material.color.setHex( 0xffffff );
      points.material.size = 0.02;
      scene.add( points );
      var center = points.geometry.boundingSphere.center;
      controls.target.set( center.x, center.y, center.z );
      controls.update();
    } );

    controls = new TrackballControls( camera, renderer.domElement );
		controls.rotateSpeed = 2.0;
		controls.zoomSpeed = 0.3;
		controls.panSpeed = 0.2;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.minDistance = 0.3;
		controls.maxDistance = 0.3 * 100;

    stats = new Stats();
    this.mount.appendChild( stats.dom );
    //ADD CUBE
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: '#433F81'     });
    // this.cube = new THREE.Mesh(geometry, material);
    // this.scene.add(this.cube);
    this.start();

    window.addEventListener( 'resize', this.onWindowResize, false );

    window.addEventListener( 'keypress', this.keyboard );
  }

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(renderer.domElement);
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop = () => {
    cancelAnimationFrame(this.frameId);
  }

  animate = () => {
    
    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;
    controls.update();
    stats.update();
    this.renderScene();
    this.frameId = requestAnimationFrame(this.animate);
  }

  renderScene = () => {
    renderer.render(scene, camera);
  }

  onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
  }

  keyboard = ( ev ) => {
    var points = scene.getObjectByName( '000015.pcd' );
    switch ( ev.key || String.fromCharCode( ev.keyCode || ev.charCode ) ) {
      case '+':
        points.material.size *= 1.2;
        points.material.needsUpdate = true;
        break;
      case '-':
        points.material.size /= 1.2;
        points.material.needsUpdate = true;
        break;
      case 'c':
        points.material.color.setHex( Math.random() * 0xffffff );
        points.material.needsUpdate = true;
        break;
    }
  }
  
  render() {
    return (
      <div
        style={{ width: window.innerWidth, height: window.innerHeight }}
        ref={(mount) => { this.mount = mount }}
      />
    );
  }
}

export default App;