const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const bodyParser = require("body-parser");
const timeOutMiddleware = require("./middleware/timeOut.js");

app.use(bodyParser.json());
app.use(timeOutMiddleware);
app.use(express.json());

app.get("/:username", (req, res) => {
  const { username } = req.params;
  if (!fs.existsSync(`./backend/users/${username}.json`)) {
    res.status(400);
    res.statusMessage = "Invalid username provided";
    console.log("Invalid username provided");
    res.send();
  } else {
    fs.readFile(`./backend/users/${username}.json`, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send();
      } else res.send(data);
    });
  }
});

// PUT request to /b/{id} get in the body params updated object and return the updated object
app.put("/:username", (req, res) => {
  const { username } = req.params;
  const { body } = req;
  if (!fs.existsSync(`./backend/users/${username}.json`)) {
    res.status(400).send(`{
          "message": "Invalid username provided",
        }`);
  } else {
    fs.writeFile(
      `./backend/users/${username}.json`,
      JSON.stringify(body, null, 4),
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send();
        } else {
          res.status(201).send(body);
        }
      }
    );
  }
});

// POST request to /b create new object and return the new object
app.post("/:username", (req, res) => {
  const { username } = req.params;
  if (fs.existsSync(`./backend/users/${username}.json`)) {
    res.status(400);
    res.statusMessage = "Username already exist";
    console.log("Username already exist");
    res.send();
  } else {
    const body = { "my-todo": [] };
    fs.writeFile(
      `./backend/users/${username}.json`,
      JSON.stringify(body, null, 4),
      (err) => {
        if (err) {
          res.status(500).json({ message: "Error!", error: err });
        } else {
          res.status(200).send();
        }
      }
    );
  }
});

app.listen(port, () => {
  console.log(`app listening on port: ${port}`);
});
