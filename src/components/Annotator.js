import React, { Component } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import * as THREE from "three";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

import $ from "jquery";
import { CSVLink } from "react-csv";

import "../static/Annotator.css";
import configs from "../configs.json";

import PointService from "../services/PointService";
let pointService = PointService.getInstance();

var camera, controls, scene, stats, renderer, loader, pointcloud;
// var bboxHelperList = [];

var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.01;
var mouse = new THREE.Vector2();

var pointclouds;

var clock = new THREE.Clock();
var toggle = 0;

var sphereKps = []; // array of {uuid, keypoint_label}

var sphereGeometry = new THREE.SphereBufferGeometry(0.04, 32, 32);
var sphereMaterial = new THREE.MeshBasicMaterial({ color: "#FF0000" });
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.scale.set(1, 1, 1);


function range(start, end) {
  return new Array(end - start + 1)
    .fill(undefined)
    .map((_, i) => (i + start).toString());
}

const fids = range(configs["begin_fid"], configs["end_fid"]);
// const bboxes = fids;
var selected_fid = "0";

const frameFolder = configs["pcd_folder"] + "/" + configs["set_nm"];
// const bboxFolder = settings["configs"]["bbox_folder"] + "/" + set_nm;



class Annotator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: 0,
      intrinsic: 0,
      extrinsic: 0,
      point: [],
      selected_keypoint_label: "",
      selected_keypoint_color: "#FFFFFF"
    };
  }

  componentDidMount() {
    this.init();

    this.animate();
  }

  init = () => {
    $(".alert-success").hide();

    const width = 0.75 * window.innerWidth;
    const height = 0.85 * window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x008000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.dofAutofocus = true;
    this.mount.appendChild(renderer.domElement);

    console.log(this.mount.clientWidth);
    console.log(window.innerWidth);

    camera = new THREE.PerspectiveCamera(65, width / height, 1, 1000);
    // camera = new THREE.OrthographicCamera( 5, -5, 3, 0, 1, 1000 );
    camera.position.set(2, 2, 2);
    camera.up.set(0, 0, 1);

    this.setState({
      intrinsic: this.cameraMatrix2npString(camera.projectionMatrix),
      extrinsic: this.cameraMatrix2npString(camera.matrixWorldInverse)
    });

    // console.log(this.cameraMatrix2npString(camera.projectionMatrix));
    // console.log(this.cameraMatrix2npString(camera.matrixWorldInverse));
    // scene.add(camera);

    // controls

    controls = new MapControls(camera, renderer.domElement);

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
    var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // stats
    stats = new Stats();
    // this.mount.appendChild( stats.dom );

    // sphere
    scene.add(sphere);

    window.addEventListener("resize", this.onWindowResize, false);

    window.addEventListener("keypress", this.onKeyPress);

    window.addEventListener("mousemove", this.onMouseMove, false);

    window.addEventListener("click", this.onMouseClick, false);
  };

  cameraMatrix2npString = cameraMatrix => {
    var npString = "np.array([";
    for (var i = 0; i < 4; i++) {
      npString += "[";
      for (var j = 0; j < 4; j++) {
        var pos = i * 4 + j;
        npString +=
          cameraMatrix.elements[pos] === 0
            ? cameraMatrix.elements[pos]
            : cameraMatrix.elements[pos].toFixed(4);
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
  };

  addPointcloud = () => {
    pointcloud = new THREE.Points(new THREE.Geometry(), new THREE.Material());
    loader = new PCDLoader();
    loader.load(
      frameFolder + "/" + selected_fid + ".pcd",
      points => {
        pointcloud = points;

        if (points.material.color.r !== 1) {
          points.material.color.setHex(0x000000);
        }

        points.material.size = 0.02;

        scene.add(pointcloud);

        pointclouds = [pointcloud];

        // var center = points.geometry.boundingSphere.center;
        // controls.target.set( center.x, center.y, center.z );
        // controls.update();
      },
      xhr => {
        this.setState({
          loaded: Math.round((xhr.loaded / xhr.total) * 100)
        });

        // console.log( ( this.state.loaded ) + '% loaded' );
      }
    );
  };

  // addBbox = () => {
  //   if (bboxes.includes(selected_fid)) {
  //     fetch(bboxFolder + '/' + selected_fid + '.txt')
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
    scene.remove(pointcloud);
  };

  removeSphereKps = () => {
    sphereKps.map(pair => {
      const object = scene.getObjectByProperty("uuid", pair.uuid);
      object.geometry.dispose();
      object.material.dispose();
      scene.remove(object);
    });
    renderer.renderLists.dispose();
    sphereKps = [];
  };

  showSphereKps = () => {
    const keypoints = pointService.getKeypoints();
    if (typeof keypoints[selected_fid] !== "undefined") {
      console.log("existed");

      var keypoint_labels = Object.keys(keypoints[selected_fid]);

      for (const keypoint_label of keypoint_labels) {
        for (const keypoint of configs["keypoints"]) {
          if (keypoint.label === keypoint_label) {
            var keypoint_color = keypoint.color;
          }
        }
        var sphereKpGeometry = new THREE.SphereBufferGeometry(0.04, 32, 32);
        var sphereKpMaterial = new THREE.MeshBasicMaterial({
          color: keypoint_color
        });
        var sphereKp = new THREE.Mesh(sphereKpGeometry, sphereKpMaterial);
        sphereKp.position.copy(keypoints[selected_fid][keypoint_label]);
        sphereKps.push({
          uuid: sphereKp.uuid,
          keypoint_label: keypoint_label
        });
        scene.add(sphereKp);
      }
    }
  };

  clearCurFrameKps = () => {
    console.log("clear");
    pointService.removeKeypointsByFrame(selected_fid);
    this.removeSphereKps();
  };

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

    requestAnimationFrame(this.animate);

    controls.update();

    stats.update();

    this.renderScene();
  };

  renderScene = () => {
    camera.updateMatrixWorld();

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    if (typeof pointclouds !== "undefined") {
      var intersections = raycaster.intersectObjects(pointclouds);
      var intersection = intersections.length > 0 ? intersections[0] : null;
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
  };

  onMouseMove = e => {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    e.preventDefault();
    mouse.x = (e.clientX / this.mount.clientWidth) * 2 - 1;
    mouse.y =
      -((e.clientY - 0.1 * window.innerHeight) / this.mount.clientHeight) * 2 +
      1;
    console.log();
  };

  onMouseClick = e => {
    if (e.shiftKey && this.state.selected_keypoint_label !== "") {
      pointService.addKeypoint(
        selected_fid,
        this.state.selected_keypoint_label,
        this.state.point
      );

      var found = false;
      var sphereKp;
      for (const pair of sphereKps) {
        if (pair.keypoint_label === this.state.selected_keypoint_label) {
          sphereKp = scene.getObjectByProperty("uuid", pair.uuid);
          sphereKp.position.copy(this.state.point);
          found = true;
          break;
        }
      }
      if (!found) {
        var sphereKpGeometry = new THREE.SphereBufferGeometry(0.04, 32, 32);
        var sphereKpMaterial = new THREE.MeshBasicMaterial({
          color: this.state.selected_keypoint_color
        });
        sphereKp = new THREE.Mesh(sphereKpGeometry, sphereKpMaterial);
        sphereKp.position.copy(this.state.point);
        sphereKps.push({
          uuid: sphereKp.uuid,
          keypoint_label: this.state.selected_keypoint_label
        });
        scene.add(sphereKp);
      }

      console.log(scene.children);

      console.log(pointService.getKeypoints());
    }
  };

  onWindowResize = () => {
    camera.aspect = (0.75 * window.innerWidth) / (0.85 * window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(0.75 * window.innerWidth, 0.85 * window.innerHeight);
  };

  onKeyPress = e => {
    console.log(e.keyCode);
    var points = scene.getObjectByName(selected_fid + ".pcd");
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
        if (fids.indexOf(selected_fid) + 1 < fids.length) {
          selected_fid = fids[fids.indexOf(selected_fid) + 1];
          this.onFrameUpdate();

          if (pointService.findMarkedFrame(selected_fid) !== -1) {
            $(".alert-success").show();
          } else {
            $(".alert-success").hide();
          }
        }
        break;
      case 97: // a
        if (fids.indexOf(selected_fid) - 1 > -1) {
          selected_fid = fids[fids.indexOf(selected_fid) - 1];
          this.onFrameUpdate();

          if (pointService.findMarkedFrame(selected_fid) !== -1) {
            $(".alert-success").show();
          } else {
            $(".alert-success").hide();
          }
        }
        break;
      case 102: // f
        var idx = pointService.findMarkedFrame(selected_fid);
        if (idx === -1) {
          pointService.addMarkedFrame(selected_fid);
          $(".alert-success").show();
        } else {
          pointService.removeMarkedFrame(selected_fid);
          $(".alert-success").hide();
        }
        break;
      default:
        break;
    }
  };

  onFrameUpdate = e => {
    if (typeof e !== "undefined") {
      selected_fid = e.target.id;
      console.log(selected_fid);
    }

    this.removePointcloud();
    this.removeSphereKps();
    // this.removeBbox();

    this.showSphereKps();

    this.addPointcloud();
    // this.addBbox();
  };

  handleKeypointChange = e => {
    const keypoint_label = e.target.value;
    this.setState({ selected_keypoint_label: keypoint_label });
    console.log(keypoint_label);
    for (const keypoint of configs["keypoints"]) {
      if (keypoint.label === keypoint_label) {
        this.setState({ selected_keypoint_color: keypoint.color });
      }
    }
  };

  render() {
    return (
      <div className="contain-fluid">
        <div
          id="top"
          className="row p-2"
          style={{ height: 0.1 * window.innerHeight }}
        >
          <div className="col">
            <div>
              <b>Point Cloud Annotator</b>
            </div>
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
          <div className="col"></div>
          <div className="col"></div>
          <div className="col">
            <div className="row mr-1 justify-content-end">
              <CSVLink
                className="btn btn-dark"
                data={pointService.getMarkedFrames()}
                enclosingCharacter={``}
                filename={
                  "marks_" +
                  configs["set_nm"] +
                  ".txt"
                }
              >
                Download marks
              </CSVLink>
            </div>
            <div className="row my-2 mr-1 justify-content-end">
              <CopyToClipboard
                text={JSON.stringify(pointService.getKeypoints(), null, 2)}
                onCopy={this.onCopy}
              >
                <button className="btn btn-dark">
                  Copy keypoints to clipboard
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        <div className="row">
          <div
            id="center"
            className="col"
            style={{
              width: 0.75 * window.innerWidth,
              height: 0.85 * window.innerHeight
            }}
            ref={mount => {
              this.mount = mount;
            }}
          />
          <div
            id="right"
            className="col"
            style={{
              width: 0.25 * window.innerWidth,
              height: 0.85 * window.innerHeight
            }}
          >
            <div className="row m-2 alert alert-info">
              <strong>
                {configs["set_nm"]} {selected_fid}
              </strong>
            </div>

            <br />

            <div className="row m-2">
              <legend className="col-sm-3 p-0 col-form-label ">Frames</legend>
              <div
                className="col-sm-9 p-0 list-group"
                id="list-tab"
                role="tablist"
              >
                {fids.map((fid, i) => (
                  <a
                    key={i}
                    className={`list-group-item px-2 py-1 list-group-item-action ${
                      fid === selected_fid ? "active" : ""
                    }`}
                    id={fid}
                    data-toggle="list"
                    href={`#list-${fid}`}
                    onClick={this.onFrameUpdate}
                  >
                    {fid}
                  </a>
                ))}
              </div>
            </div>

            <br />

            <fieldset className="row m-2 form-group">
              <div className="row">
                <legend className="col-sm-3 col-form-label">Keypoints</legend>
                <div className="col-sm-9">
                  {configs["keypoints"].map((keypoint, i) => (
                    <div className="form-check" key={i}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gridRadios"
                        id={keypoint.label}
                        value={keypoint.label}
                        defaultChecked={(i = 0 ? true : false)}
                        onChange={this.handleKeypointChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={keypoint.label}
                        onChange={this.handleKeypointChange}
                      >
                        {keypoint.label}&nbsp;&nbsp;
                        <svg width="10" height="10">
                          <rect
                            width="10"
                            height="10"
                            style={{ fill: keypoint.color }}
                          />
                        </svg>
                      </label>
                    </div>
                  ))}
                  <button
                    className="btn mt-2 btn-dark"
                    onClick={this.clearCurFrameKps}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <div
          id="bottom"
          className="row p-2"
          style={{ height: 0.05 * window.innerHeight }}
        >
          <div className="col">
            <p>
              x: {this.state.point.x ? this.state.point.x.toFixed(4) : 0}
              &nbsp; y: {this.state.point.y ? this.state.point.y.toFixed(4) : 0}
              &nbsp; z: {this.state.point.z ? this.state.point.z.toFixed(4) : 0}
            </p>
          </div>
          <div className="col alert alert-success" role="alert">
            Marked!
          </div>
          <div className="col">
            {this.state.loaded !== 100 && (
              <div>{this.state.loaded}% loaded</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Annotator;

//   <div className="my-2 p-2" id="matrices">
//     <div>{"Mint = " + this.state.intrinsic}</div>
//     <br />
//     <div>{"Mext = " + this.state.extrinsic}</div>
//   </div>
