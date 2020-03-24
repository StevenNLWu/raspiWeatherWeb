const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const Timer = require("./timer");
const timer = new Timer();

// package for log
const fs = require('fs');
const util = require('util');
var log_file = fs.createWriteStream(__dirname + "/log" + "/log.log", {flags : "a"}); // 'a' means appending (old data will be preserved)
var log_stdout = process.stdout;

app.set('view engine', 'ejs');      // using EJS as our template engine
app.use(bodyParser.urlencoded({ extended: true })); // to cap http request, response

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/d3/dist')); // redirect D3 JS
app.use(express.static('public'));  // make all of the files in 'public' folder to be accessible

const port = 80;

// function to overwrite the console.log, so as to log the console-context to a text file
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

app.get('/weather', function(request, response){

  let paraRange = request.query.dtRange;
  console.log(timer.getCurrentLocaltimeInIso(true)
              + ": " 
              + request.ip 
              +"; "
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

