

/****
 * 
 *  class for device info
 * 
 */
class C_device{

  static getDeviceNo1Name() {
    return "raspiWeatherStation01";
  }

  static getDeviceNo2Name() {
    return "raspiWeatherStation02";
  }
}

/****
 * 
 *  class for data, weather data from DB
 * 
 */
class C_data{

  constructor(){

    this.data;
    this.dbSize;

  }

  /**
   * convert the raw data form DB to the web's preferred format
   * @param {string} dtRange ={1h, 12h, 1d, 7d, 1m, 6m, 1y}
   * @param {object} rawData The raw data from DB
   */
  _setData(dtRange, rawData){
  
    this.dbSize = rawData.size;

    let hrKeyName = "hour";
    let hrOffset = 1;
    let minKeyName = "min";
    let minOffset = 1;
    switch(dtRange.toString().toLowerCase() ){

      case "12h":
        minKeyName = "min/2";
        minOffset = 2;
        break;

      case "1d":
        minKeyName = "min/5";
        minOffset = 5;
        break;  

      case "1m":
        hrKeyName = "hour/2";
        hrOffset = 2;
        break;

    } // end of switch

    this.data = rawData.data.map(x => ({device: x._id.device
                                        , date: new Date(x._id.year,
                                                    x._id.month,
                                                    x._id.day,
                                                    x._id[hrKeyName] * hrOffset,
                                                    x._id[minKeyName] * minOffset,
                                                    0,
                                                    0)
                                        , temp: x.avgTemp
                                        , hum: x.avgHum
                                        , prs: x.avgPrs
                                        })
                              );
    this.data.sort((x1, x2) => x1.date- x2.date);


  } // end of function _setData

  /**
   * call DB's Api
   * @param {string} dtRange ={1h, 12h, 1d, 7d, 1m, 6m, 1y}
   */
  callApi2SelectRawData(dtRange){

    let url = config.getapiURL();
    let self = this;

    return $.get(config.getapiURL(),  // getapiURL() is a statis method in config.js
    {
      dtRange :dtRange,
      type:'GET',
      dataType: 'json',
    },
    function (rawData){

      if(rawData.status.toString().toUpperCase() === "ERROR"){

        console.log(new Date().toLocaleString()
                    + ": " 
                    + "Fail; Get " + url + "param={" + dtRange + "}; " 
                    + rawData.message.toString() 
                    );
      }else{
        console.log(new Date().toLocaleString()
                    + ": " 
                    + "Success; Get " + url + "param={" + dtRange + "}." 
                    );
        self._setData(dtRange, rawData);
      }

    }).done(function() {
      // for second success

    }).fail(function(xhr, status, error) {
      console.log(new Date().toLocaleString()
                  + ": " 
                  + status + "; "
                  + "Get / " + this.pageUrl + "param={" + dtRange + "}; "
                  + error.toString()
                  );
    }).always(function() {
        // for finished
    });

  } // end of function _callApiSelectRawData

} // end of class C_data


/****
 * 
 *  class for graph
 *  
 */
class C_d3Graph{

  constructor(){

     // set the dimensions and margins of the graph
    this.margin = {top: 50, right: 50, bottom: 50, left: 70};
    this.maxWidth = 900;
    this.maxHeight = 300;
    this.width = this.maxWidth - this.margin.left - this.margin.right,
    this.height = this.maxHeight - this.margin.top - this.margin.bottom,
    this.viewBoxSize = "0 0 " + this.maxWidth +" "+ this.maxHeight;
   
    // label variable
    this.xLabel = "Datetime";
    this.yTempLabel = "Temperature (°C)";
    this.dbTag2LineLab= [];
    this.dbTag2LineLab.push({dbTag: C_device.getDeviceNo1Name(), lineLable: "office"});
    this.dbTag2LineLab.push({dbTag: C_device.getDeviceNo2Name(), lineLable: "home"});

    // TEMP graph: add the SVG 
    this.tempGraphSvg = d3.select("#tempChart")
                          .attr("viewBox", this.viewBoxSize)       
                          .append("g")
                          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")                     
    // TEMP graph: add X axis label
    this.tempGraphSvg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("x", this.width/2)
                    .attr("y", this.height+this.margin.bottom - 5)   // -5 for the border
                    .text(this.xLabel);
    // TEMP graph: add Y axis label
    this.tempGraphSvg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")    
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0 - this.height/2 + 50)  // 50 for text length
                    .attr("y", 0 - this.margin.left/2 - 10)  // 10 for fine tuning
                    .text(this.yTempLabel);
    // TEMP graph: add the line label
    this.tempGraphSvg.append("text")
                    .attr("id", "tempLine1Lab")
    this.tempGraphSvg.append("text")
                    .attr("id", "tempLine2Lab")
     // TEMP graph: add the x-domain
    this.tempGraphXConfig = d3.scaleTime().range([ 0, this.width ]);
    this.tempGraphSvg.append("g")
                    .attr("id", "tempXDomain")
    // TEMP graph: the the y-domain
    this.tempGraphYConfig = d3.scaleLinear().range([ this.height, 0 ]);
    this.tempGraphSvg.append("g")
                    .attr("id", "tempYDomain")
    this.tempGraphSvg.append("g")
                    .attr("id", "tempGrid")   
                    .attr("class", "grid")
                    
  } // end of constructor

  /**
   * initialize the temperature (TEMP) graph, humidity graph (HUM) and pressure graph (PRS)
   * @param {object array}  weatherData data; array of object {device ∈ <string>, date ∈ <date>, temp ∈ <number>, hum ∈ <number>, prs ∈ <number>}
   */
  initGraph(weatherData){
          
    // TEMP graph: init the X axis unit, according to the data
    this.tempGraphXConfig = d3.scaleTime()
                            .domain(d3.extent(weatherData, function(d) { return d.date; }))        
                            .range([ 0, this.width ]);      
    let tempXDomain = d3.select("#tempXDomain");   
    tempXDomain.attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.tempGraphXConfig));
                     
    // TEMP graph: init the Y axis unit, according to the data
    this.tempGraphYConfig = d3.scaleLinear()
                              .domain(d3.extent(weatherData, function(d) { return d.temp; }))   
                              .range([ this.height, 0 ]);   
    let tempYDomain = d3.select("#tempYDomain");       
    tempYDomain.call(d3.axisLeft(this.tempGraphYConfig));

    // TEMP graph: init the grid
    d3.select("#tempGrid").call(d3.axisLeft(this.tempGraphYConfig)
                          .tickSize(-this.width)
                          .tickFormat(""));

    // TEMP graph: add line No1
    let x = this.tempGraphXConfig;
    let y = this.tempGraphYConfig;
    this.tempGraphSvg.append("path")
                    .datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
                    .attr("id", "tempLineNo1")
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                                  .x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.temp) })
                          );
    // TEMP graph: add Line No1 Label
    var tempLine1Lab = d3.select("#tempLine1Lab")
                        .attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")")
                        .attr("dy", ".35em")
                        .attr("text-anchor", "start")
                        .style("fill", "steelblue")
                        .text(this.dbTag2LineLab.find(x => x.dbTag == C_device.getDeviceNo1Name()).lineLable);

    // Add line No2
    let line2Data = weatherData.filter(x => x.device == C_device.getDeviceNo2Name())

  } // end of function of initGraph

  /**
   * change the graph according to the time-domain clicked by the user
   * @param {object array}  weatherData data; array of object {device ∈ <string>, date ∈ <date>, temp ∈ <number>, hum ∈ <number>, prs ∈ <number>}
   */
  switchGraph(weatherData){

      // TEMP graph: re-draw the domain, according to the new data
      this.tempGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
      this.tempGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.temp; }))
      let tempXDomain = d3.select("#tempXDomain");
      let tempYDomain = d3.select("#tempYDomain");
      tempXDomain.attr("transform", "translate(0," + this.height + ")")
                .call(d3.axisBottom(this.tempGraphXConfig));
      tempYDomain.call(d3.axisLeft(this.tempGraphYConfig));

      // TEMP graph: re-draw the line, according to the new data
      let x = this.tempGraphXConfig;
      let y = this.tempGraphYConfig;
      let tempLineNo1 = d3.select('#tempLineNo1')
      tempLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
                .attr("d", d3.line().x(function(d) { return x(d.date) })
                                    .y(function(d) { return y(d.temp) })
                      );

    // TEMP graph: relocate the Line No1 Label
    let tempLine1Lab = d3.select("#tempLine1Lab")
                        .attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")")

  } // end of function switchGraph
    
  /**
   * realtime update the graph
   * @param {object array}  weatherData data; array of object {device ∈ <string>, date ∈ <date>, temp ∈ <number>, hum ∈ <number>, prs ∈ <number>}
   */
  updateData(weatherData){

      // TEMP graph: shift the domain,  according to new data
    this.tempGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.tempGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.temp; }))
    let tempXDomain = d3.select("#tempXDomain");
    let tempYDomain = d3.select("#tempYDomain");
    tempXDomain.attr("transform", "translate(0," + this.height + ")")
              .transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisBottom(this.tempGraphXConfig));
    tempYDomain.transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisLeft(this.tempGraphYConfig));

    // TEMP graph: update the line, according to new data
    let x = this.tempGraphXConfig;
    let y = this.tempGraphYConfig;
    let tempLineNo1 = d3.select('#tempLineNo1')
    tempLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
              .attr("d", d3.line().x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.temp) })
                    );
  
    // TEMP graph: relocate the Line No1 Label
    let tempLine1Lab = d3.select("#tempLine1Lab")
                        .attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")");


  } // end of function updateData


} // end of initGraph

class C_button{

  constructor(dtRange, c_d3Graph){

    this.dtRange = dtRange.toString().toLowerCase()
    this.c_data = new C_data();
    this.c_d3Graph = c_d3Graph;

    let btId;
    switch(this.dtRange){

      case "1h":
        btId = "1hrButton";
        break;
      case "12h":
        btId = "12hrButton";
        break;
      case "1d":
        btId = "1dButton";
        break;
      case "7d":
        btId = "7dButton";
        break;
      case "1m":
        btId = "1mButton";
        break;
      case "6m":
        btId = "6mButton";
        break;
      case "1y":
        btId = "1yButton";
        break;
  }

  document.getElementById(btId).addEventListener('click', function(){
      this.clickMe(this.dtRange);   
      console.log("pressed " + dtRange + " button");
    }.bind(this));

  } 

  /**
   * This function will be riggered in case of clicking the conresponding button.
   * The web will change the graph according to the time-domain clicked by the user
   */
  async clickMe(){

    // remember which date-range user clicked
    localStorage.setItem("dtRange", this.dtRange);

    // refresh the data
    await this.c_data.callApi2SelectRawData(this.dtRange);
    this.c_d3Graph.switchGraph(this.c_data.data);
  }
} // end of class C_button


/*** ****************** *****/
/*                        */
/*  initization in here    */
/*                        */
/***************************/
const refreshTime = 60000; // in ms
if(! (dtRange = localStorage.getItem('dtRange'))){
  dtRange = "1h";
}

(async () => {

    // get data from Api
    c_data = new C_data();
    await c_data.callApi2SelectRawData(dtRange);

    // init the graph
    c_d3Graph = new C_d3Graph();
    c_d3Graph.initGraph(c_data.data);

    // add event to button
    c_bt1h = new C_button("1h", c_d3Graph);
    c_bt12h = new C_button("12h", c_d3Graph);
    c_bt1d = new C_button("1d", c_d3Graph);
    c_bt7d = new C_button("7d", c_d3Graph);
    c_bt1m = new C_button("1m", c_d3Graph);
    c_bt6m = new C_button("6m", c_d3Graph);
    c_bt1y = new C_button("1y", c_d3Graph);

    // realtime refresh the graph, according to new data
    setInterval(async function(){
  
      dtRange = localStorage.getItem('dtRange')
      await c_data.callApi2SelectRawData(dtRange);
      c_d3Graph = new C_d3Graph();
      c_d3Graph.updateData(c_data.data);
    }, refreshTime //1000 = 1s
    ) 
})();