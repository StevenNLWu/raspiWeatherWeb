// package
const bodyParser = require('body-parser');
const express = require('express');
const DbConfig = require("./domainConfig");
const Timer = require("./timer");

// constant variable
const app = express();
const timer = new Timer();
const httpPort = 80;
const httpsPort = 3000;

// package for log
const fs = require('fs');
const util = require('util');
var log_file = fs.createWriteStream(__dirname + "/log" + "/log.log", {flags : "a"}); // 'a' means appending (old data will be preserved)
var log_stdout = process.stdout;

// function to overwrite the console.log, so as to log the console-context to a text file
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// app setting
app.set('view engine', 'ejs');      // using EJS as our template engine
app.use(bodyParser.urlencoded({ extended: true })); // to cap http request, response
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/d3/dist')); // redirect D3 JS
app.use(express.static('public'));  // make all of the files in 'public' folder to be accessible

// SSL cert
const http = require("http");
const https = require("https");
const domainName = DbConfig.DOMAIN;
const cert = fs.readFileSync(__dirname + DbConfig.CERT);
const ca = fs.readFileSync(__dirname + DbConfig.CA);
const key = fs.readFileSync(__dirname + DbConfig.KEY);
const httpsOptions = {
   cert: cert,
   ca: ca,
   key: key
};
const httpServer = http.createServer(app);
const httpsServer = https.createServer(httpsOptions, app);

// redirect all http to https
app.use((req, res, next) => {

  if(req.protocol === 'http') {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  if(req.get('host').indexOf(domainName) == -1){
    res.end();
    return;
  }

  next();
});

app.get('/weather', function(request, response){

  let paraRange = request.query.dtRange;
  console.log(timer.getCurrentLocaltimeInIso()
              + ": " 
              + request.ip 
              +"; "
              + "Get /weather, param={" + paraRange + "}" 
              );


  response.render('weather');
})  

httpServer.listen(httpPort);
httpsServer.listen(httpsPort, domainName);

