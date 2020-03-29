class PointService {
  static myInstance = null;
  static getInstance() {
    if (PointService.myInstance == null) {
      PointService.myInstance = new PointService();
    }
    return this.myInstance;
  }

  marked_frames = [];
  keypoints = {};

  // marked_frames
  addMarkedFrame = fid => {
    this.marked_frames.push([fid]);
    console.log(fid + " added!");
    console.log(this.markedFrames);
  };

  removeMarkedFrame = (fid) => {
    var idx = this.findMarkedFrame(fid);
    this.marked_frames.splice(idx, 1);
    console.log(fid + " removed!");
    console.log(this.marked_frames);
  };

  getMarkedFrames = () => {
    return this.marked_frames;
  };

  findMarkedFrame = fid => {
    var idx = -1;
    for (var i = 0; i < this.marked_frames.length; i++)
      if (this.marked_frames[i][0] === fid) idx = i;
    return idx;
  };

  // keypoints
  addKeypoint = (selected_fid, kp_id, point) => {
    this.keypoints[selected_fid] = {};
    this.keypoints[selected_fid][kp_id] = point;
  };

  updateKeypoint = (selected_fid, kp_id, point) => {
    this.keypoints[selected_fid][kp_id] = point;
  };

  getKeypoints = () => {
    return this.keypoints;
  };
}

export default PointService;