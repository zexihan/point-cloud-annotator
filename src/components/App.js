import React, { Component } from 'react';

import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

var camera, controls, scene, stats, renderer, loader;

class App extends Component {
  componentDidMount() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcccccc );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    this.mount.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      1,
      1000
    );
    camera.position.set(0, 0, 0);
    camera.up.set( 0, 0, 1 );
    //scene.add(camera);
    
    // controls

    controls = new MapControls( camera, renderer.domElement );
    
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    
    controls.screenSpacePanning = false;
    
    controls.minDistance = 1;
    controls.maxDistance = 500;
    
    controls.maxPolarAngle = Math.PI / 2;

    // world

    loader = new PCDLoader();
    loader.load( './data/pcd/000015.pcd', function ( points ) {
      points.material.color.setHex( 0x000000 );
      points.material.size = 0.04;
      scene.add( points );
      var center = points.geometry.boundingSphere.center;
      controls.target.set( center.x, center.y, center.z );
      controls.update();
    } );

  
    stats = new Stats();
    this.mount.appendChild( stats.dom );


    window.addEventListener( 'resize', this.onWindowResize, false );

    window.addEventListener( 'keypress', this.onKeyPress );

    this.animate();
  }

  animate = () => {
    
    requestAnimationFrame( this.animate );

    controls.update();
    
    stats.update();
    
    this.renderScene();

  }

  renderScene = () => {

    renderer.render(scene, camera);

  }

  onWindowResize = () => {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
   
    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  onKeyPress = ( e ) => {
    console.log(e.keyCode);
    var points = scene.getObjectByName( '000015.pcd' );
    switch ( e.keyCode ) {
      case 61:
        points.material.size *= 1.2;
        points.material.needsUpdate = true;
        break;
      case 45:
        points.material.size /= 1.2;
        points.material.needsUpdate = true;
        break;
      case 99:
        points.material.color.setHex( Math.random() * 0xffffff );
        points.material.needsUpdate = true;
        break;
      default:
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