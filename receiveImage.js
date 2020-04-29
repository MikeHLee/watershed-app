const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const fs = require('fs');

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }));

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

        // to convert base64 format into random filename
        //const base64Data = imgdata.split("base64");//[1];)
        //const base64Data = imgdata.match( /^data:([A-Za-z-+/]+);base64,/, '');


        fs.writeFileSync(path, imageString,  {encoding: 'base64'});

        return res.send(path);

    } catch (e) {
        next(e);
    }
}

app.post('/upload/image', uploadImage)


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

