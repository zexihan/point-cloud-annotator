import React, { Component } from 'react';

import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import $ from 'jquery'; 
import { CSVLink } from 'react-csv';

import '../static/App.css';
import configs from "./configs.json";

var camera, controls, scene, stats, renderer, loader, pointcloud;
// var bboxHelperList = [];

var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.01;
var mouse = new THREE.Vector2();

var pointclouds;
var keypoints = {};
var kp_id = 0;

var clock = new THREE.Clock();
var toggle = 0;

var sphereGeometry = new THREE.SphereBufferGeometry(0.04, 32, 32);
var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.scale.set(1, 1, 1);

function range(start, end) {
  return (new Array(end - start + 1)).fill(undefined).map((_, i) => (i + start).toString());
}

const files = range(configs["begin_fid"], configs["end_fid"]);
// const bboxes = files;
var fileSelected = '0';

const fileFolder = configs["pcd-folder"] + "/" + configs["set_nm"];
// const bboxFolder = settings["configs"]["bbox-folder"] + "/" + set_nm;

var markedFrames = [];

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      
      loaded: 0,
      intrinsic: 0,
      extrinsic: 0,
      point: []
    };
  }

  componentDidMount() {
    this.init();

    this.animate();
  }

  init = () => {

    $('.alert-success').hide();

    const width = 0.75 * window.innerWidth;
    const height = 0.85 * window.innerHeight;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x008000 );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(width, height);
    renderer.dofAutofocus = true;
    this.mount.appendChild( renderer.domElement );
    
    console.log(this.mount.clientWidth);
    console.log(window.innerWidth);

    camera = new THREE.PerspectiveCamera(
      65,
      width / height,
      1,
      1000
    );
    // camera = new THREE.OrthographicCamera( 5, -5, 3, 0, 1, 1000 );
    camera.position.set(2, 2, 2);
    camera.up.set( 0, 0, 1 );
    

    this.setState({
      intrinsic: this.cameraMatrix2npString(camera.projectionMatrix),
      extrinsic: this.cameraMatrix2npString(camera.matrixWorldInverse)
    });

    // console.log(this.cameraMatrix2npString(camera.projectionMatrix));
    // console.log(this.cameraMatrix2npString(camera.matrixWorldInverse));
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
    // this.addBbox();
    
    // axis
    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
    
    // stats
    stats = new Stats();
    // this.mount.appendChild( stats.dom );

    // sphere
    scene.add(sphere);

    window.addEventListener( 'resize', this.onWindowResize, false );

    window.addEventListener( 'keypress', this.onKeyPress );

    window.addEventListener( 'mousemove', this.onMouseMove, false );

    window.addEventListener("click", this.onMouseClick, false);
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

      points.material.size = 0.02;
      
      scene.add( pointcloud );

      pointclouds = [pointcloud];
      
      // var center = points.geometry.boundingSphere.center;
      // controls.target.set( center.x, center.y, center.z );
      // controls.update();
    },
    ( xhr ) => {
      this.setState({
        loaded: Math.round(xhr.loaded / xhr.total * 100)
      });

      // console.log( ( this.state.loaded ) + '% loaded' );
  
    } );
  }

  // addBbox = () => {
  //   if (bboxes.includes(fileSelected)) {
  //     fetch(bboxFolder + '/' + fileSelected + '.txt')
  //       .then((res) => res.text())
  //       .then(text => {
  //         var lines = text.split(/\r\n|\n/);
  //         lines = lines.map(line => { return line.split(' ') });

  //         var labels = {};
  //         console.log(lines.length);
  //         for (var i = 0; i < lines.length; i++) {
  //           labels[i] = lines[i].slice(0, 6).map(Number);
  //         }
  //         // console.log(labels);

  //         for (var i = 0; i < lines.length; i++) {
  //           var bbox = new THREE.Box3();
  //           // bbox.setFromCenterAndSize( new THREE.Vector3( labels[i][3], labels[i][4], labels[i][5] ), new THREE.Vector3( labels[i][1], labels[i][2], labels[i][0] ) );
  //           bbox.set(new THREE.Vector3( labels[i][0], labels[i][1], labels[i][2] ), new THREE.Vector3( labels[i][3], labels[i][4], labels[i][5] ))
  //           var bboxHelper = new THREE.Box3Helper( bbox, 0x00FF00 );
  //           bboxHelperList.push(bboxHelper);
  //           scene.add( bboxHelper );
  //         }
          
  //       })
  //   }
  // }

  removePointcloud = () => {
    scene.remove( pointcloud );
  }

  // removeBbox = () => {
  //   for (var i = 0; i < bboxHelperList.length; i++) {
  //     scene.remove( bboxHelperList[i] );
  //   }
  // }

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

    camera.updateMatrixWorld();

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    if (typeof pointclouds !== "undefined") {
      var intersections = raycaster.intersectObjects(pointclouds);
      var intersection = (intersections.length) > 0 ? intersections[0] : null;
      if (toggle > 0.02 && intersection != null) {
        this.setState({
          point: intersection.point
        });
        sphere.position.copy(intersection.point);

        toggle = 0;
      }
    }

    toggle += clock.getDelta();

    renderer.render(scene, camera);

  }

  onMouseMove = ( event ) => {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault();
    mouse.x = (event.clientX / this.mount.clientWidth ) * 2 - 1;
    mouse.y = - ((event.clientY - 0.1 * window.innerHeight) / this.mount.clientHeight ) * 2 + 1;
    console.log()
  }

  onMouseClick = (event) => {
    if (event.shiftKey) {
      if (fileSelected in keypoints === false) {
        keypoints[fileSelected] = {};
        keypoints[fileSelected][kp_id] = this.state.point;
      } else {
        keypoints[fileSelected][kp_id] = this.state.point;
      }
      kp_id += 1;
      console.log(keypoints);
    }
  }

  onWindowResize = () => {
    camera.aspect = (0.75 * window.innerWidth) / (0.85 * window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize( 0.75 * window.innerWidth, 0.85 * window.innerHeight );

  }

  onKeyPress = ( e ) => {
    console.log(e.keyCode);
    var points = scene.getObjectByName( fileSelected + '.pcd' );
    var flag;
    switch (e.keyCode) {
      case 61: // +
        points.material.size *= 1.2;
        points.material.needsUpdate = true;
        break;
      case 45: // -
        points.material.size /= 1.2;
        points.material.needsUpdate = true;
        break;
      case 99: // c
        points.material.color.setHex(Math.random() * 0xffffff);
        points.material.needsUpdate = true;
        break;
      case 100: // d
        if (files.indexOf(fileSelected) + 1 < files.length) {
          fileSelected = files[files.indexOf(fileSelected) + 1];
          this.onFileNext();

          flag = false;
          for (const markedFrame of markedFrames) {
            if (markedFrame[0] === fileSelected) flag = true;
          }
          if (flag) {
            $(".alert-success").show();
          } else {
            $(".alert-success").hide();
          }

          kp_id = 0; 
        }
        break;
      case 97: // a
        if (files.indexOf(fileSelected) - 1 > -1) {
          fileSelected = files[files.indexOf(fileSelected) - 1];
          this.onFilePrev();

          flag = false;
          for (const markedFrame of markedFrames) {
            if (markedFrame[0] === fileSelected) flag = true;
          }
          if (flag) {
            $(".alert-success").show();
          } else {
            $(".alert-success").hide();
          }

          kp_id = 0;
        }
        break;
      case 102: // f
        var idx = -1;
        for (var i = 0; i < markedFrames.length; i++) {
          if (markedFrames[i][0] === fileSelected) idx = i;
        }
        if (idx === -1) {
          markedFrames.push([fileSelected]);
          console.log(fileSelected + " added!");
          console.log(markedFrames);
          $(".alert-success").show();
        } else {
          markedFrames.splice(idx, 1);
          console.log(fileSelected + " removed!");
          console.log(markedFrames);
          $(".alert-success").hide();
        }
        break;
      default:
        break;
    }
  }

  onFileSelect = (e) => {
    fileSelected = e.target.id;
    console.log(fileSelected);

    this.removePointcloud();
    // this.removeBbox();

    this.addPointcloud();
    // this.addBbox();
  }

  onFileNext = () => {
    this.removePointcloud();
    // this.removeBbox();

    this.addPointcloud();
    // this.addBbox();
  }

  onFilePrev = () => {
    this.removePointcloud();
    // this.removeBbox();

    this.addPointcloud();
    // this.addBbox();
  }
  
  render() {
    return (
      <div className="contain-fluid">
        <div id="top" className="row p-2" style={{ height: 0.1 * window.innerHeight}}>
          <div className="col">
            <div><b>Point Cloud Annotator</b></div>
            <div>Suning Commerce R&D Center USA</div>
            <div>Applied AI Lab</div>
            <div>
              <a
                href="https://zexihan.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zexi Han
              </a>
            </div>
          </div>
          <div className="col">
            
          </div>
          <div className="col">

          </div>
          <div className="col">
            <div className="row mr-1 justify-content-end">
              <CSVLink
                className="btn btn-dark"
                data={markedFrames}
                enclosingCharacter={``}
                filename={
                  configs["mark-folder"] +
                  "/" +
                  "marks_" +
                  configs["set_nm"] +
                  ".txt"
                }
              >
                Download marks
              </CSVLink>
            </div> 
            <div className="row my-2 mr-1 justify-content-end ">
              <button className="btn btn-dark">
                Download keypoints
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <div
            id="center" 
            className="col"
            style={{ width: 0.75 * window.innerWidth, height: 0.85 * window.innerHeight }}
            ref={mount => {
              this.mount = mount;
            }}
          />
          <div id="right" className="col" style={{ width: 0.25 * window.innerWidth, height: 0.85 * window.innerHeight }}>
            <div className="row m-2 alert alert-info">
              <strong>
                {configs["set_nm"]} {fileSelected}
              </strong>
            </div>
            <div className="row m-2 list-group" id="list-tab" role="tablist">
              {files.map((filename, i) => (
                <a
                  key={i}
                  className={`list-group-item px-2 py-1 list-group-item-action ${
                    filename === fileSelected ? "active" : ""
                    }`}
                  id={filename}
                  data-toggle="list"
                  href={`#list-${filename}`}
                  onClick={this.onFileSelect}
                >
                  {filename}
                </a>
              ))}
            </div>
            <div className="row m-2">
              {
                this.state.loaded !== 100 && (
                  <div>{this.state.loaded}% loaded</div>
                )
              }
            </div>
            <div className="row m-2 alert alert-success" role="alert">
              Marked!
            </div>
            
            
          </div>
        </div>
        
        
        <div id="bottom" className="row p-2" style={{ height: 0.05 * window.innerHeight }}>
          <div className="col">
            <p>
              x: {this.state.point.x ? this.state.point.x.toFixed(4) : 0}
              &nbsp; y:{" "}
              {this.state.point.y ? this.state.point.y.toFixed(4) : 0}&nbsp;
              z: {this.state.point.z ? this.state.point.z.toFixed(4) : 0}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default App;



//   <div className="my-2 p-2" id="matrices">
//     <div>{"Mint = " + this.state.intrinsic}</div>
//     <br />
//     <div>{"Mext = " + this.state.extrinsic}</div>
//   </div>