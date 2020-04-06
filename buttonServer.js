var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static(__dirname + '/node_modules'));

app.get('/button', function(req, res,next) {
    res.sendFile(__dirname + '/buttonHTML.html');
});



io.on('connection', function(client) {

    client.on('messages', function(data) {
	    console.log(data);
    });

});

//server.listen(3000);
