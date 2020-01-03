import React, { Component } from 'react';

import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import $ from 'jquery'; 
import { CSVLink } from 'react-csv';

import '../static/App.css';

var camera, controls, scene, stats, renderer, loader, pointcloud;
var bboxHelperList = [];

// var raycaster = new THREE.Raycaster();
// raycaster.params.Points.threshold = 0.04;
// var mouse = new THREE.Vector2();

function range(start, end) {
  return (new Array(end - start + 1)).fill(undefined).map((_, i) => (i + start).toString());
}

const files = range(9379, 10479);
const bboxes = files;
var fileSelected = files[0];

var set_tag = 'user5_2';
const fileFolder = './data/pcd/PC_RGB_SOR/' + set_tag;
const bboxFolder = './data/bbox/PCL_DET_RES/' + set_tag;

var markedFrames = [];

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loaded: 0,
      intrinsic: 0,
      extrinsic: 0
    };
  }

  componentDidMount() {
    this.init();

    this.animate();
  }

  init = () => {

    $('.alert-success').hide();

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x808080 );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    renderer.dofAutofocus = true;
    this.mount.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera(
      65,
      width / height,
      1,
      1000
    );
    // camera = new THREE.OrthographicCamera( 5, -5, 3, 0, 1, 1000 );
    camera.position.set(3,3,3);
    camera.up.set( 0, 0, 1 );
    

    this.setState({
      intrinsic: this.cameraMatrix2npString(camera.projectionMatrix),
      extrinsic: this.cameraMatrix2npString(camera.matrixWorldInverse)
    });

    console.log(this.cameraMatrix2npString(camera.projectionMatrix));
    console.log(this.cameraMatrix2npString(camera.matrixWorldInverse));
    // scene.add(camera);
    
    // controls

    controls = new MapControls( camera, renderer.domElement );
    
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    
    controls.screenSpacePanning = false;
    
    controls.minDistance = 1;
    controls.maxDistance = 500;
    
    controls.maxPolarAngle = Math.PI / 2;

    // point cloud
    this.addPointcloud();

    // bbox
    this.addBbox();
    
    // axis
    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
    
    // stats
    stats = new Stats();
    this.mount.appendChild( stats.dom );


    window.addEventListener( 'resize', this.onWindowResize, false );

    window.addEventListener( 'keypress', this.onKeyPress );

    // window.addEventListener( 'mousemove', this.onMouseMove, false );
  }

  cameraMatrix2npString = ( cameraMatrix ) => {
    var npString = "np.array([";
    for (var i = 0; i < 4; i++) {
      npString += "["
      for (var j = 0; j < 4; j++) {
        var pos = i * 4 + j;
        npString += cameraMatrix.elements[pos] === 0 ? cameraMatrix.elements[pos] : cameraMatrix.elements[pos].toFixed(4);
        if (j !== 3) {
          npString += ", ";
        }
      }
      npString += "]";
      if (i !== 3) {
        npString += ", ";
      }
    }
    npString += "])";
    return npString;
  }

  addPointcloud = () => {
    
    pointcloud = new THREE.Points(new THREE.Geometry(), new THREE.Material());
    loader = new PCDLoader();
    loader.load(fileFolder + '/' + fileSelected + '.pcd', 
    ( points ) => {

      pointcloud = points;

      if (points.material.color.r !== 1) {
        points.material.color.setHex( 0x000000 );
      }

      points.material.size = 0.04;
      
      scene.add( pointcloud );
      
      // var center = points.geometry.boundingSphere.center;
      // controls.target.set( center.x, center.y, center.z );
      // controls.update();
    },
    ( xhr ) => {
      this.setState({
        loaded: Math.round(xhr.loaded / xhr.total * 100)
      });

      console.log( ( this.state.loaded ) + '% loaded' );
  
    } );
  }

  addBbox = () => {
    if (bboxes.includes(fileSelected)) {
      fetch(bboxFolder + '/' + fileSelected + '.txt')
        .then((res) => res.text())
        .then(text => {
          var lines = text.split(/\r\n|\n/);
          lines = lines.map(line => { return line.split(' ') });

          var labels = {};
          console.log(lines.length);
          for (var i = 0; i < lines.length; i++) {
            labels[i] = lines[i].slice(0, 6).map(Number);
          }
          // console.log(labels);

          for (var i = 0; i < lines.length; i++) {
            var bbox = new THREE.Box3();
            // bbox.setFromCenterAndSize( new THREE.Vector3( labels[i][3], labels[i][4], labels[i][5] ), new THREE.Vector3( labels[i][1], labels[i][2], labels[i][0] ) );
            bbox.set(new THREE.Vector3( labels[i][0], labels[i][1], labels[i][2] ), new THREE.Vector3( labels[i][3], labels[i][4], labels[i][5] ))
            var bboxHelper = new THREE.Box3Helper( bbox, 0x00FF00 );
            bboxHelperList.push(bboxHelper);
            scene.add( bboxHelper );
          }
          
        })
    }
  }

  removePointcloud = () => {
    scene.remove( pointcloud );
  }

  removeBbox = () => {
    for (var i = 0; i < bboxHelperList.length; i++) {
      scene.remove( bboxHelperList[i] );
    }
  }

  animate = () => {

    // console.log(camera.position.clone());

    this.setState({
      intrinsic: this.cameraMatrix2npString(camera.projectionMatrix),
      extrinsic: this.cameraMatrix2npString(camera.matrixWorldInverse)
    });
    
    requestAnimationFrame( this.animate );

    controls.update();
    
    stats.update();
    
    this.renderScene();

  }

  renderScene = () => {

    // update the picking ray with the camera and mouse position
    // raycaster.setFromCamera( mouse, camera );

    // calculate objects intersecting the picking ray
    // var intersects = raycaster.intersectObjects( scene.children );
    
    // for ( var i = 0; i < intersects.length; i++ ) {

    //   intersects[ i ].object.material.color.set( 0xff0000 );

    // }

    renderer.render(scene, camera);

  }

  // onMouseMove = ( event ) => {

  //   // calculate mouse position in normalized device coordinates
  //   // (-1 to +1) for both components
  
  //   mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  //   mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  // }

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
      case 100:
        if (files.indexOf(fileSelected) + 1 < files.length) {
          fileSelected = files[files.indexOf(fileSelected) + 1]
          this.onFileNext();

          var flag = false;
          for (const markedFrame of markedFrames) {
              if (markedFrame[0] === fileSelected)
                  flag = true;
          }
          if (flag) {
            $('.alert-success').show();
          } else {
            $('.alert-success').hide();
          }
        }
        break
      case 97:
        if (files.indexOf(fileSelected) - 1 > -1) {
          fileSelected = files[files.indexOf(fileSelected) - 1]
          this.onFilePrev();

          var flag = false;
          for (const markedFrame of markedFrames) {
              if (markedFrame[0] === fileSelected)
                  flag = true;
          }
          if (flag) {
            $('.alert-success').show();
          } else {
            $('.alert-success').hide();
          }
        }
        break
      case 102:
        var idx = -1;
        for (var i = 0; i < markedFrames.length; i++) {
            if (markedFrames[i][0] === fileSelected)
                idx = i;
        }
        if (idx === -1) {
          markedFrames.push([fileSelected]);
          console.log(fileSelected + " added!")
          console.log(markedFrames);
          $('.alert-success').show();
        } else {
          markedFrames.splice(idx, 1);
          console.log(fileSelected + " removed!")
          console.log(markedFrames);
          $('.alert-success').hide();
        }
        break
      default:
        break;
    }
  }

  onFileSelect = (e) => {
    fileSelected = e.target.id;
    console.log(fileSelected);

    this.removePointcloud();
    this.removeBbox();

    this.addPointcloud();
    this.addBbox();
  }

  onFileNext = () => {
    this.removePointcloud();
    this.removeBbox();

    this.addPointcloud();
    this.addBbox();
  }

  onFilePrev = () => {
    this.removePointcloud();
    this.removeBbox();

    this.addPointcloud();
    this.addBbox();
  }
  
  render() {
    return (
      <div>
        
        <div id="info-mouse" className="d-none d-sm-block">

          <div>Point Cloud Viewer by <a href="https://zexihan.com" target="_blank" rel="noopener">Zexi Han</a></div>
          <div>axis: <font style={{color:'red'}}>X</font>  <font style={{color:'lime'}}>Y</font> <font style={{color:'blue'}}>Z</font></div>
          <div>left mouse button + move: Pan the map</div>
          <div>right mouse button + move: Rotate the view</div>
          <div>mouse wheel: Zoom up and down</div>
          <div>a/d: Previous/Next frame</div>
          <div>+/-: Increase/Decrease point size</div>
          <div>c: Change color</div>
          <div>f: Mark</div>
          {this.state.loaded !== 100 && <div>{this.state.loaded}% loaded</div>}

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
              <a key={i} className="dropdown-item" id={filename} href="#" onClick={this.onFileSelect}>{filename}</a>
            )}
          </div>
        </div>
        <div id="filelist" className="row d-none d-sm-block">
          <div className="col">
            
            <div class="alert alert-info">
              <strong>{set_tag} {fileSelected}</strong> 
            </div>
            
            <div className="list-group" id="list-tab" role="tablist">
              {files.map((filename, i) => 
                <a key={i} 
                   className={`list-group-item px-2 py-1 list-group-item-action ${filename === fileSelected ? 'active' : ''}`}
                   id={filename} 
                   data-toggle="list" 
                   href={`#list-${filename}`} 
                   onClick={this.onFileSelect}>
                     {filename}
                </a>
              )}
            </div>

            {/* <div class="my-2 p-2 d-none d-sm-block" id="matrices">
              <div>{"Mint = " + this.state.intrinsic}</div>
              <br />
              <div>{"Mext = " + this.state.extrinsic}</div>
            </div> */}
            
            <div class="alert alert-success" role="alert">
              Marked!
            </div>
            <CSVLink 
              data={markedFrames} 
              enclosingCharacter={``}
              filename={"marked_frames_"+ set_tag + ".txt"}
              className="btn btn-light">
                Download marks
            </CSVLink>

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