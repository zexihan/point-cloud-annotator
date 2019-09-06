import React, { Component } from 'react';

import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import '../static/App.css';

var camera, controls, scene, stats, renderer, loader;

var fileSelected = 'store_100k';
var files = ['store_100k', 'store_100k_object_rgb', 'store', '000015'];

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loaded: 0
    };
  }

  componentDidMount() {
    this.init(fileSelected);

    this.animate();
  }

  init = (filename) => {

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
    camera.position.set(5, -5, 5);
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
    loader.load( './data/pcd/' + filename + '.pcd', 
    ( points ) => {

      if (points.material.color.r !== 1) {
        points.material.color.setHex( 0x000000 );
      }

      points.material.size = 0.04;
      
      scene.add( points );
      
      var center = points.geometry.boundingSphere.center;
      controls.target.set( center.x, center.y, center.z );
      controls.update();
    },
    ( xhr ) => {
      this.setState({
        loaded: Math.round(xhr.loaded / xhr.total * 100)
      });

      console.log( ( this.state.loaded ) + '% loaded' );
  
    } );

    // bbox

    // fetch('./data/bbox/' + filename + '.txt')
    //   .then((res) => res.text())
    //   .then(text => {
    //     var lines = text.split(/\r\n|\n/);
    //     lines = lines.map(line => { return line.split(' ') });
    //     var bbox = {};
    //     for (var i = 0; i < lines.length / 8; i++) {
    //       bbox[i] = [];
    //       for (var j = 0; j < 8; j++) {
    //         bbox[i].push(lines[i * 8 + j].slice(1, 4).map(Number));
    //       }
    //     }
    //     console.log(bbox);
    //     console.log(bbox[0][0]);

    //     var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
        
    //     for (var i = 0; i < 4; i++) {
    //       var geometry = new THREE.Geometry();
    //       for (var j = 0; j < 8; j++) {
    //         geometry.vertices.push(new THREE.Vector3( bbox[i][j][2], -bbox[i][j][0], -bbox[i][j][1] ) );
    //         if (j === 3) {
    //           geometry.vertices.push(new THREE.Vector3( bbox[i][0][2], -bbox[i][0][0], -bbox[i][0][1] ) );
    //         }
    //         if (j === 7) {
    //           geometry.vertices.push(new THREE.Vector3( bbox[i][4][2], -bbox[i][4][0], -bbox[i][4][1] ) );
    //         }
    //       }
    //       var line = new THREE.Line( geometry, material );
    //       scene.add( line );
    //     }
        
    // });

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
    
    // stats
    stats = new Stats();
    this.mount.appendChild( stats.dom );


    window.addEventListener( 'resize', this.onWindowResize, false );

    window.addEventListener( 'keypress', this.onKeyPress );
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
    var points = scene.getObjectByName( fileSelected + '.pcd' );
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

  onFileSelect = (e) => {
    console.log(e.target.id);
    fileSelected = e.target.id;
    while (this.mount.firstChild) {
      this.mount.removeChild(this.mount.firstChild);
    }

    this.init(fileSelected);
    this.animate();
  }
  
  render() {
    return (
      <div>
        
        <div id="info-mouse" className="d-none d-sm-block">
          <div>Point Cloud Viewer by <a href="https://zexihan.com" target="_blank" rel="noopener">Zexi Han</a></div>
          <div>left mouse button + move: Pan the map</div>
          <div>right mouse button + move: Rotate the view</div>
          <div>mouse wheel: Zoom up and down</div>
          <div>+/-: Increase/Decrease point size</div>
          <div>c: Change color</div>
          <div>{this.state.loaded}% loaded</div>
        </div>
        <div id="info-touch" className="d-sm-none">
          <div>Point Cloud Viewer by <a href="https://zexihan.com" target="_blank" rel="noopener">Zexi Han</a></div>
          <div>one finger: Pan the map</div>
          <div>two fingers: Scale and rotate the view</div>
          <div>{this.state.loaded}% loaded</div>
        </div>
        <div className="dropdown d-sm-none">
          <button className="btn btn-dark dropdown-toggle" type="button" id="framesBtn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Frames
          </button>
          <div className="dropdown-menu d-sm-none" aria-labelledby="framesBtn">
            {files.map((filename, i) =>
              <a key={i} className="dropdown-item" id={filename} href="#" onClick={this.onFileSelect}>{filename}.pcd</a>
            )}
          </div>
        </div>
        <div id="filelist" className="row d-none d-sm-block">
          <div className="col">
            <div>Frames</div>
            <div className="list-group" id="list-tab" role="tablist">
              {files.map((filename, i) => 
                <a key={i} 
                   className={`list-group-item px-2 py-1 list-group-item-action ${filename === fileSelected ? 'active' : ''}`}
                   id={filename} 
                   data-toggle="list" 
                   href={`#list-${filename}`} 
                   onClick={this.onFileSelect}>
                     {filename}.pcd
                </a>
              )}
            </div>
          </div>
        </div>
        {/* <button className="btn btn-dark">BUTTON</button> */}
        <div
          style={{ width: window.innerWidth, height: window.innerHeight }}
          ref={(mount) => { this.mount = mount }}
        />
        
      </div>
      
    );
  }
}

export default App;