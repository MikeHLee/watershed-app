const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const fs = require('fs');

var server = require('http').createServer(app);

// parse application/x-www-form-urlencoded
// parse application/json
// Tell the bodyparser middleware to accept more data
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));;


const uploadImage = async (req, res, next) => {

    try {

        // to declare some path to store your converted image
        //const path = './images/'+Date.now()+'.png';
        const path = './images/pic.jpg';

        let imageString = req.body['image'];

        fs.writeFileSync(path, imageString,  {encoding: 'base64'});
        console.log('new image sent')

        return res.send(path);

    } catch (e) {
        next(e);
    }
}

app.post('/upload/image', uploadImage)


// convert lastest data to json -> csv -> html-line chart for display
var path = require('path');
app.get('/image', (req, res) => {

        //see image
        res.sendFile(path.join(__dirname +'/images/pic.jpg'));

});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))


