const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const base64Img = require("base64-img");
var file;
var landmarksUser;
var landmarksData;

app.use(cors());
app.use(express.json());

// Search landMArks of Detected user
app.post("/user/landmarks", async (req, res) => {
  landmarksUser = req.body.landmarksUser;
  console.log("Landmarks of user : " + landmarksUser);
  fs.readFile(
    `./users/${landmarksUser}/landmarks.txt`,
    "utf8",
    function (err, data) {
      landmarksData = data;
      res.json({ message: "txt file" });
    }
  );
});
// Transfer Landmarks of Detected
app.get("/user/landmarksdata", (req, res) => {
  console.log(landmarksData);

  res.send(landmarksData);
});

// Create Folder of new User
app.post("/user/image", async (req, res) => {
  const contents = req.body.photo;
  const name = req.body.username;
  const landMarks = req.body.landmarks;
  fs.mkdir(`users/${name}`, { recursive: true }, (err) => {
    if (!err) {
      base64Img.img(
        contents,
        path.join(__dirname, `users/${name}`),
        "1",
        (err, filepath) => {
          const textFilePath = path.join(
            __dirname,
            `users/${name}/landmarks.txt`
          );
          fs.writeFile(textFilePath, landMarks, (err) => {
            if (!err) {
              console.log("Done");
            }
          });
        }
      );
    }
  });
});

// Get all Names of Existing User
app.get("/user/image", (req, res) => {
  fs.readdir("./users", function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    file = files;
  });
  res.send(file);
});

app.listen(3000, () => {
  console.log("Sever lisning!");
});
