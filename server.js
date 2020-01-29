const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const Timer = require("./timer");
const timer = new Timer();

app.set('view engine', 'ejs');      // using EJS as our template engine
app.use(bodyParser.urlencoded({ extended: true })); // to cap http request, response

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/d3/dist')); // redirect D3 JS


app.use(express.static('public'));  // make all of the files in 'public' folder to be accessible

const port = 3000;

app.get('/weather', function(request, response){

  let paraRange = request.query.dtRange;
  console.log(timer.getCurrentLocaltimeInIso(true)
              + ": " 
              + "Get /weather, param={" + paraRange + "}" 
              );


  response.render('weather');
})
  

app.listen(port, function () {
   
  console.log( timer.getCurrentLocaltimeInIso(true)
              + ": " 
              +"Server listening on port " + port + "."
              );
})




