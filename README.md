# Point Cloud Annotator (in dev)

A web based annotation tool for 3D computer vision tasks. The tool is developed in the context of cashier-less convenience store research by Suning. It supports point clouds (.pcd) for the annotation task of **pose estimation**, **tracking**, and **reID**. It is a SPA developed with [React](http://reactjs.org) and [three.js](https://threejs.org/).

<img align="center" src="https://github.com/zexihan/point-cloud-annotator/blob/master/extra/Capture1.png">

For the annotation task of **detection** and **semantic segmentation**, please refer to [Semantic Segmentation Editor](https://github.com/Hitachi-Automotive-And-Industry-Lab/semantic-segmentation-editor) by Hitachi Automotive and Industry Lab.

## How to run

#### Install Node.js

Download a pre-built installer for your platform from https://nodejs.org/en/download/.

#### Download the repo

```
git clone https://github.com/zexihan/point-cloud-annotator.git
```

#### Start the application

```
cd point-cloud-annotator
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

#### (Optional) Edit the configs.json.

By default, point clouds are served from a subfolder in <code>public/data/pcd</code>. Sample person point clouds are included in <code>public/data/pcd/person</code>.

```
{
    "set_nm": "person",
    "begin_fid": 0,
    "end_fid": 6,
    "pcd_folder": "./data/pcd",
    "bbox_folder": "./data/bbox",
    "keypoints_folder": "./data/keypoints",
    "keypoints": [
        {"label": "left_ear", "color": "#9A3254"},
        {"label": "right_ear", "color": "#E85D88"},
        {"label": "left_shoulder", "color": "#FF8815"},
        {"label": "right_shoulder", "color": "#FFE832"},
        {"label": "left_elbow", "color": "#1FB93E"},
        {"label": "right_elbow", "color": "#1AAEAA"},
        {"label": "left_wrist", "color": "#83BCFF"},
        {"label": "right_wrist", "color": "#208BFB"},
        {"label": "left_hip", "color": "#54351A"},
        {"label": "right_hip", "color": "#5D36E1"}
    ]
}
```

## How to use

### Control

<div>
  axis helper:
  <font style="color:red">X</font>
  <font style="color:lime">Y</font>
  <font style="color:blue">Z</font>
</div>

left mouse button + move: Pan the map

right mouse button + move: Rotate the view

mouse wheel: Zoom up and down

a/d: Previous/Next frame

+/-: Increase/Decrease point size

c: Change color

f: Mark/Unmark

shift + left mouse button: Add/Remove key point

### PCD support

 - Supported input PCD format: ASCII
 - Supported input fields: `x`, `y`, `z`, `rgb` (optional integer)