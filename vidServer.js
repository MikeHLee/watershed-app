const express = require('express');
const cv = require('opencv4nodejs');
const app = express();

const path = require('path');
const FPS = 30;
const server = require('http').Server(app);
const io = require('socket.io')(server);



const wCap = new cv.VideoCapture(0);

app.get('/', function (req, res) {
    res.sendFile('index.html', {root: __dirname});
});


setInterval(() => {
    const frame = wCap.read();
    const image = cv.imencode('.jpg', frame).toString('base64');

    io.emit('image', image)
}, 1000/FPS);
server.listen(3000);
