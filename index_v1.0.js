//------------------------------------------------------------------
//  Watershed App Main Program
// 
// Code is organized into the following sections
// - App Imports
// - Device Comms
// 	- send
// 	- receive
// - Client Comms
// 	- send
// 	- receive
// - Cloud Comms
// 	- send
// 	- receive
// - Maintainence/Cleanup
//------------------------------------------------------------------

//  TODO:
//  - load default setParams from last remembered state
//  - rotate and serve image
//  - make paramDes interface smoother
//  - move left graph info to right graph and extend viewing window
//  - talk with UI designer

//Begin:

// - App Imports ---------------------------------------------------

// Start express app
const express = require('express');
const app = express();
const port = 3000; //TCP

// Body Parser is ExpressJS middleware that allows
// us to parse data from incoming requests.
var bodyParser = require('body-parser');
//app settings?
app.use(bodyParser.json());
app.use(express.static(__dirname + '/node_modules'));

//filesystem allows us to look at files on the server
const fs = require('fs');

//AWS S3 is where we're going to store our files
const AWS = require('aws-sdk');

// Get AWS S3 Keys
const ID = 'AKIAJVX5MCS3273BC4RQ';
const SECRET = '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';
const BUCKET_NAME_DATA = 'watersheddata';
const BUCKET_NAME_PHOTOS = 'watershedphotos';

//connect to AWS s3
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

//create socket server
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//import path library 
//https://nodejs.org/api/path.html
var path = require('path');

//------------------------------------------------------------------

// - Device Comms --------------------------------------------------

// 	- send

// This is the route to send the setpoints to the unit.
app.get('/api/params', (req, res) => {
        let data = paramDes;
        res.send(data);
});

// 	- receive

//default sensor data
var sensorData = {'temp': 0,
		  'hum': 0}

var visData = [];
var startDateTime = new Date().toISOString()

// This route is for sensor data coming from the unit.
app.post('/api/heartbeat', (req, res) => {
        let data = req.body;
        sensorData['temp'] = data['temp'];
	sensorData['hum'] = data['hum'];
        console.log(sensorData);
	res.send(sensorData);

        //add data for csv
        visData.push({	Temperature: sensorData['temp'],
                      	idealTemp: paramDes['tempDes'],
			Humidity: sensorData['hum'],
                        idealHum: paramDes['humDes']}
			);

	//add data to csv
        csvWriter
                .writeRecords(visData)
                .then(()=> console.log('The CSV file was written successfully'));

	//clear visData
        visData=[];

        //real time data
        var today = new Date();

	//emit websockets event for realtime graph
	io.sockets.emit('sensorData',
			{date: (today.getDate()-1)+"-"+(today.getMonth()+1)+"-"+today.getFullYear(),
			time: (today.getHours())+":"+(today.getMinutes()),
			temp: sensorData['temp'],
 			hum: sensorData['hum']}
			);

	var record = fs.readFileSync('data4.csv','utf8');
	//console.log(record);

	uploadData('data4.csv', startDateTime);
	console.log('data uploaded to s3')

	//emit websockets event for cumulative graph
	io.sockets.emit('cumulativeData', {cumulative: record});
	});

// Receive image from device
	// Tell the bodyparser middleware to accept more data
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));;

const uploadImage = async (req, res, next) => {
	// to declare some path to store your converted image
        //const path = './images/'+Date.now()+'.png';
        const path = './images/pic.jpg';

        let imageString = req.body['image'];

        fs.writeFileSync(path, imageString,  {encoding: 'base64'});
        console.log('new image sent')

	uploadPic('./images/pic.jpg', new Date().toISOString());
	console.log('image uploaded to s3')

        return res.send(path);
}

app.post('/upload/image', uploadImage)
//------------------------------------------------------------------

// - Client Comms --------------------------------------------------

// 	- send

//Page for chekcing that server is running
app.get('/', (req, res) =>{
        res.send('server running');
});

//Page For checking what our variables are set to. Gives info on system state
app.get('/desParams', (req, res)=>{
        res.send('STATUS:' + '<br/>' +
                 'Temperature set to: '+JSON.stringify(paramDes['tempDes'])+' degrees' +'<br/>' +
                 'Humidity set to: '+JSON.stringify(paramDes['humDes'])+' percent' +'<br/>' +
                 'Lighting Mode set to: '+JSON.stringify(paramDes['lightMode']) +'<br/>' +
                 'Sunrise at '+JSON.stringify(paramDes['timeOn'])+':00 hours' +'<br/>' +
                 'Sunset at '+JSON.stringify(paramDes['timeOff'])+':00 hours' +'<br/>' +
		 'Camera frequency: every '+JSON.stringify(paramDes['cameraInterval'])+' seconds' +'<br/>');
});

//this page shows real time data of the last 15 data received (to be extended)
app.use('/realtime', express.static('displayrealtime5.html'));

// convert lastest data to json -> csv -> html-line chart for display, set to display chart
app.get('/chart', (req, res) => {
        console.log('user viewing chart');
        //convert csv to html
        //https://www.npmjs.com/package/chart-csv
        //using shell commands
        //https://stackabuse.com/executing-shell-commands-with-node-js/;

        //visualize data
        res.sendFile(path.join(__dirname +'/data4.html'));

});

// display image
app.get('/image', (req, res) => {

        //see image
        res.sendFile(path.join(__dirname +'/images/pic.jpg'));

});

//dashboard that brings it all together. May replace with react later
app.use('/allInOne', express.static('allInOne.html'));

// 	- receive

//default desired setpoints
var paramDes = {'tempDes': 75,
		'humDes': 50,
		'lightMode': "off",
		'timeOn': 0,
		'timeOff': 0,
		'cameraInterval': 10} //loads default first, then from the client thereafter

//Page for Setting the desired variables
app.get('/setParams', function(req, res,next) {
    res.sendFile(__dirname + '/setParams2.html');
});

//handles how client enteracts with server, what info it sents (listens for an event from the client)
io.on('connection', function(client) {

    console.log('client did something');

    client.on('messages1', function(data) {
	    console.log(data); //prints users input to server log
	    data = parseInt(data); //string to intiger
	    paramDes['tempDes'] = data; //updates desired temperature
    });

    client.on('messages2', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
            paramDes['humDes'] = data; //updates desired temperature
    });

    client.on('messages3', function(data) {
            console.log(data); //prints users input to server log
            //data = parseInt(data); //no need to convert to integer here!
            paramDes['lightMode'] = data; //updates desired temperature
    });

    client.on('messages4', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
            paramDes['timeOn'] = data; //updates desired temperature
    });

    client.on('messages5', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
            paramDes['timeOff'] = data; //updates desired temperature
    });

    client.on('messages6', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
            paramDes['cameraInterval'] = data; //updates desired temperature
    });

});
//------------------------------------------------------------------

// - Cloud Comms ---------------------------------------------------

// 	- send

// push updated .csv to the cloud
const uploadData = (fileName, key) => {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME_DATA,
        Key: key, // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`Data uploaded successfully. ${data.Location}`);
    });
};

// push new image to the cloud
const uploadPic = (fileName, key) => {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME_PHOTOS,
        Key: key, // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`Image uploaded successfully. ${data.Location}`);
    });
};

// 	- receive
//------------------------------------------------------------------

// - Backend -------------------------------------------------------

// for using shell commands, see
const { exec } = require("child_process");

//this is for saving the data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data4.csv',
  header: [
          {id: 'Temperature', title: 'Temp'},
          {id: 'idealTemp', title: 'IdealTemp'},
	  {id: 'Humidity', title: 'Hum'},
          {id: 'idealHum', title: 'IdealHum'}
  	  ]
});

//AJS93 -- added functionality to automatically tell when
//install: npm install canihazip
//Prints info to the console
var icanhazip = require('icanhazip');
icanhazip.IPv4().then(function(myIP) {
        console.log('------------------')
        console.log(`Server running at http://${myIP}:${port}/`);
        console.log('------------------')
	console.log('pages:')
        console.log('/---- will let you know if server is running')
        console.log('/allInOne provides the master dashboard view')
	console.log('/desParams ---- will let you know what the desired tempurture is set to')
	console.log('/setParams sets parameters')
	console.log('/chart gives real time cumulative')
	console.log('/realtime gives real time data for the current session')
	console.log('/image displays the most recent grow-chamber image')
        console.log('------------------')


}).catch(function(e) {
        console.error(e.message);
});


//EVERYTHING BELOW THIS LINE GOES AT THE BOTTOM, IN THIS ORDER!

//start the app
server.listen(3000);

//handle non existant pages and when something messes up
//https://github.com/sitepoint-editors/node-forms
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
//------------------------------------------------------------------











