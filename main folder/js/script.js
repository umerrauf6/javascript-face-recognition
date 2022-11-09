// const imageUpload = document.getElementById("imageUpload");
let videoCanvas = document.getElementById("videoCanvas");
var context = videoCanvas.getContext("2d");
let camera_button = document.querySelector("#start-camera");
let video = document.querySelector("#video");
let click_button = document.querySelector("#click-photo");
let imageCanvas = document.querySelector("#imageCanvas");
let dataurl_container = document.querySelector("#dataurl-container");
let captureMeasurements = document.querySelector("#capture-measurements");
let formData = document.querySelector("#formData");
let nameInput = document.querySelector("#FullName");
let faceMeasurements = document.querySelector("#faceMeasurements");
let image = new Image();
let face_landmarksMeasurment = "";
let image_data_url;
var labels = [];
let faceMatcher,
  labeledFaceDescriptors,
  container,
  data,
  capturing,
  model,
  webcam,
  landmarks,
  right_eye,
  right_ear,
  nose,
  left_eye,
  left_ear;

// Collecting Existing Data Holders Name
async function getOldData() {
  const { data } = await axios.get("http://localhost:3000/user/image");
  labels = data;
  console.table(labels);
}
getOldData();
camera_button.addEventListener("click", async function () {
  let stream = null;

  // Loading All Models
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  ]).then(start);

  async function start() {
    document.querySelector(".cover-spin").style.display = "block";
    container = document.createElement("div");
    container.style.position = "relative";
    document.body.append(container);
    labeledFaceDescriptors = await loadLabeledImages();
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
  }

  // Detecting Faces from Images

  function loadLabeledImages() {
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i < 2; i++) {
          const img = await faceapi.fetchImage(
            `../node folder/users/${label}/${i}.jpg`
          );
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  }

  // Start Streaming

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  } catch (error) {
    alert(error.message);
    return;
  }

  video.srcObject = stream;

  camera_button.style.display = "none";
  click_button.style.display = "block";

  video.addEventListener(
    "play",
    function () {
      draw(this, context, 320, 240);
    },
    false
  );
});

// Start Model and Draw face landMarks

async function draw(video, context, width, height) {
  const modelBlaze = await blazeface.load();
  const predictionsBlaze = await modelBlaze.estimateFaces(video, false);

  if (predictionsBlaze.length > 0) {
    for (let i = 0; i < predictionsBlaze.length; i++) {
      const start = predictionsBlaze[i].topLeft;
      const end = predictionsBlaze[i].bottomRight;
      var probability = predictionsBlaze[i].probability;
      const size = [end[0] - start[0], end[1] - start[1]];

      landmarks = predictionsBlaze[i].landmarks;
      right_eye = landmarks[0];
      context.fillRect(right_eye[0], right_eye[1], 8, 8);
      left_eye = landmarks[1];
      context.fillRect(left_eye[0], left_eye[1], 8, 8);

      nose = landmarks[2];
      context.fillRect(nose[0], nose[1], 8, 8);
      mouth = landmarks[3];
      context.fillRect(mouth[0], mouth[1], 8, 8);
      right_ear = landmarks[4];
      context.fillRect(right_ear[0], right_ear[1], 8, 8);
      left_ear = landmarks[5];
      context.fillRect(left_ear[0], left_ear[1], 8, 8);
      context.stroke();
      prob = (probability[0] * 100).toPrecision(5).toString();
      text = "Confidence:" + prob + "%";
      console.log(text);
      faceMeasurements.value = text;
      document.querySelector(".cover-spin").style.display = "none";

      return text;
    }
  }
}

// Recogition and printing

click_button.addEventListener("click", async function () {
  imageCanvas
    .getContext("2d")
    .drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);
  image_data_url = imageCanvas.toDataURL("image/jpeg");
  face_landmarksMeasurment = `
  rightEye: {
    x:${parseInt(right_eye[0], 10)}
    y:${parseInt(right_eye[1], 10)}
  }
  leftEye: {
    x:${parseInt(left_eye[0], 10)}
    y:${parseInt(left_eye[1], 10)}
  }
  nose: {
    x:${parseInt(nose[0], 10)}
    y:${parseInt(nose[1], 10)}
  }
  leftEar: {
    x:${parseInt(left_ear[0], 10)}
    y:${parseInt(left_ear[1], 10)}
  }
  RightEar: {
    x:${parseInt(right_ear[0], 10)}
    y:${parseInt(right_ear[1], 10)}
  }
  Mouth: {
    x:${parseInt(mouth[0], 10)}
    y:${parseInt(mouth[1], 10)}
  }`;

  image.src = "";
  image.src = image_data_url;

  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const results = detections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
  );

  // Logging Detected User
  console.log("results " + results);
  if (results[0]._label === "unknown") {
    formData.style.visibility = "visible";
    video.style.visibility = "hidden";
    click_button.style.visibility = "hidden";

    document.getElementById("bt").addEventListener("click", function (e) {
      e.preventDefault();
      comonName = nameInput.value;
      face_landmarksMeasurment = `Name : ${comonName}
      face Measurments : ${face_landmarksMeasurment}`;

      // Check if entered name is already registered
      if (labels.includes(comonName)) {
        alert("Please enter another name");
      } else {
        // Posting Data If its new face
        fetch("http://localhost:3000/user/image", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photo: image_data_url,
            username: nameInput.value,
            landmarks: face_landmarksMeasurment,
          }),
        })
          .then((res) => {
            res.json();
          })
          .then((res) => console.log(res));
      }
    });
  } else {
    // Sending data to server
    async function sendData() {
      // console.log("aaa");
      const postLandMarks = await axios.post(
        "http://localhost:3000/user/landmarks",
        {
          landmarksUser: results[0]._label,
        }
      );
      // Receiving data to print
      const { data } = await axios.get(
        "http://localhost:3000/user/landmarksdata"
      );

      console.log(data);

      faceMeasurements.value = data;
    }
    sendData();
  }
});
