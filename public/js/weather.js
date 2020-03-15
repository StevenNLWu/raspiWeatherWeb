

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
                  + "Get / " + url + "param={" + dtRange + "}; "
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
    this.yHumLabel = "Humidity (%)";
    this.yPrsLabel = "Pressure (hPa)";
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
                    .attr("font-weight", "bold")
                    .attr("x", this.width/2)
                    .attr("y", this.height+this.margin.bottom - 5)   // -5 for the border
                    .text(this.xLabel);
    // TEMP graph: add Y axis label
    this.tempGraphSvg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")   
                    .attr("font-weight", "bold") 
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
                    .attr("font-weight", "bold")
    // TEMP graph: add the the y-domain
    this.tempGraphYConfig = d3.scaleLinear().range([ this.height, 0 ]);
    this.tempGraphSvg.append("g")
                    .attr("id", "tempYDomain")
                    .attr("font-weight", "bold")
    // TEMP graph: add grid
    this.tempGraphSvg.append("g")
                    .attr("id", "tempGrid")   
                    .attr("class", "grid")        

    // HUM graph: add the SVG 
    this.humGraphSvg = d3.select("#humChart")
                          .attr("viewBox", this.viewBoxSize)       
                          .append("g")
                          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")                     
    // HUM graph: add X axis label
    this.humGraphSvg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("font-weight", "bold")
                    .attr("x", this.width/2)
                    .attr("y", this.height+this.margin.bottom - 5)   // -5 for the border
                    .text(this.xLabel);
    // HUM graph: add Y axis label
    this.humGraphSvg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")    
                    .attr("font-weight", "bold")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0 - this.height/2 + 50)  // 50 for text length
                    .attr("y", 0 - this.margin.left/2 - 10)  // 10 for fine tuning
                    .text(this.yHumLabel);
    // HUM graph: add the line label
    this.humGraphSvg.append("text")
                    .attr("id", "humLine1Lab")
    this.humGraphSvg.append("text")
                    .attr("id", "humLine2Lab")
     // HUM graph: add the x-domain
    this.humGraphXConfig = d3.scaleTime().range([ 0, this.width ]);
    this.humGraphSvg.append("g")
                    .attr("id", "humXDomain")
                    .attr("font-weight", "bold")
    // HUM graph: add the y-domain
    this.humGraphYConfig = d3.scaleLinear().range([ this.height, 0 ]);
    this.humGraphSvg.append("g")
                    .attr("id", "humYDomain")
                    .attr("font-weight", "bold")
    // HUM graph: add grid                    
    this.humGraphSvg.append("g")
                    .attr("id", "humGrid")   
                    .attr("class", "grid")

    // PRS graph: add the SVG 
    this.prsGraphSvg = d3.select("#prsChart")
                        .attr("viewBox", this.viewBoxSize)       
                        .append("g")
                        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")                     
    // PRS graph: add X axis label
    this.prsGraphSvg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("font-weight", "bold")
                    .attr("x", this.width/2)
                    .attr("y", this.height+this.margin.bottom - 5)   // -5 for the border
                    .text(this.xLabel);
    // PRS graph: add Y axis label
    this.prsGraphSvg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")    
                    .attr("font-weight", "bold")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0 - this.height/2 + 50)  // 50 for text length
                    .attr("y", 0 - this.margin.left/2 - 10)  // 10 for fine tuning
                    .text(this.yPrsLabel);
    // PRS graph: add the line label
    this.prsGraphSvg.append("text")
                    .attr("id", "prsLine1Lab")
    this.prsGraphSvg.append("text")
                    .attr("id", "prsLine2Lab")
    // PRS graph: add the x-domain
    this.prsGraphXConfig = d3.scaleTime().range([ 0, this.width ]);
    this.prsGraphSvg.append("g")
                    .attr("id", "prsXDomain")
                    .attr("font-weight", "bold")
    // PRS graph: add the y-domain
    this.prsGraphYConfig = d3.scaleLinear().range([ this.height, 0 ]);
    this.prsGraphSvg.append("g")
                    .attr("id", "prsYDomain")
                    .attr("font-weight", "bold")
    // PRS graph: add grid    
    this.prsGraphSvg.append("g")
                    .attr("id", "prsGrid")   
                    .attr("class", "grid");

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
    d3.select("#tempLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")")
                            .attr("dy", ".35em")
                            .attr("text-anchor", "start")
                            .style("fill", "steelblue")
                            .text(this.dbTag2LineLab.find(x => x.dbTag == C_device.getDeviceNo1Name()).lineLable);
    // Add line No2
    // (not implement yet)
    //weatherData.filter(x => x.device == C_device.getDeviceNo2Name())

    // HUM graph: init the X axis unit, according to the data
    this.humGraphXConfig = d3.scaleTime()
                            .domain(d3.extent(weatherData, function(d) { return d.date; }))        
                            .range([ 0, this.width ]);      
    let humXDomain = d3.select("#humXDomain");   
    humXDomain.attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.humGraphXConfig));                     
    // HUM graph: init the Y axis unit, according to the data
    this.humGraphYConfig = d3.scaleLinear()
                              .domain(d3.extent(weatherData, function(d) { return d.hum; }))   
                              .range([ this.height, 0 ]);   
    let humYDomain = d3.select("#humYDomain");       
    humYDomain.call(d3.axisLeft(this.humGraphYConfig));
    // HUM graph: init the grid
    d3.select("#humGrid").call(d3.axisLeft(this.humGraphYConfig)
                          .tickSize(-this.width)
                          .tickFormat(""));
    // HUM graph: add line No1
    x = this.humGraphXConfig;
    y = this.humGraphYConfig;
    this.humGraphSvg.append("path")
                    .datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
                    .attr("id", "humLineNo1")
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                                  .x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.hum) })
                          );
    // HUM graph: add Line No1 Label
    d3.select("#humLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].hum) + ")")
                            .attr("dy", ".35em")
                            .attr("text-anchor", "start")
                            .style("fill", "steelblue")
                            .text(this.dbTag2LineLab.find(x => x.dbTag == C_device.getDeviceNo1Name()).lineLable);
    // Add line No2
    // (not implement yet)

    // PRS graph: init the X axis unit, according to the data
    this.prsGraphXConfig = d3.scaleTime()
                            .domain(d3.extent(weatherData, function(d) { return d.date; }))        
                            .range([ 0, this.width ]);      
    let prsXDomain = d3.select("#prsXDomain");   
    prsXDomain.attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.prsGraphXConfig));               
    // PRS graph: init the Y axis unit, according to the data
    this.prsGraphYConfig = d3.scaleLinear()
                              .domain(d3.extent(weatherData, function(d) { return d.prs; }))   
                              .range([ this.height, 0 ]);   
    let prsYDomain = d3.select("#prsYDomain");       
    prsYDomain.call(d3.axisLeft(this.prsGraphYConfig).tickFormat(function(d){return d3.format(".2f")(d)}));      
    // PRS graph: init the grid
    d3.select("#prsGrid").call(d3.axisLeft(this.prsGraphYConfig)
                          .tickSize(-this.width)
                          .tickFormat(""));
    // PRS graph: add line No1
    x = this.prsGraphXConfig;
    y = this.prsGraphYConfig;
    this.prsGraphSvg.append("path")
                    .datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
                    .attr("id", "prsLineNo1")
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                                  .x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.prs) })
                          );
    // PRS graph: add Line No1 Label
    d3.select("#prsLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].prs) + ")")
                            .attr("dy", ".35em")
                            .attr("text-anchor", "start")
                            .style("fill", "steelblue")
                            .text(this.dbTag2LineLab.find(x => x.dbTag == C_device.getDeviceNo1Name()).lineLable);
    // Add line No2
    // (not implement yet)

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
    d3.select("#tempLine1Lab").attr("transform", "translate(" + (this.width+3) 
                                    + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")")

    // HUM graph: re-draw the domain, according to the new data
    this.humGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.humGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.hum; }))
    let humXDomain = d3.select("#humXDomain");
    let humYDomain = d3.select("#humYDomain");
    humXDomain.attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.humGraphXConfig));
    humYDomain.call(d3.axisLeft(this.humGraphYConfig));
    // HUM graph: re-draw the line, according to the new data
    x = this.humGraphXConfig;
    y = this.humGraphYConfig;
    let humLineNo1 = d3.select('#humLineNo1')
    humLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
              .attr("d", d3.line().x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.hum) })
                    );
    // HUM graph: relocate the Line No1 Label
    d3.select("#humLine1Lab").attr("transform", "translate(" + (this.width+3) 
                                  + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].hum) + ")")

    // PRS graph: re-draw the domain, according to the new data
    this.prsGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.prsGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.prs; }))
    let prsXDomain = d3.select("#prsXDomain");
    let prsYDomain = d3.select("#prsYDomain");
    prsXDomain.attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.prsGraphXConfig));
    prsYDomain.call(d3.axisLeft(this.prsGraphYConfig).tickFormat(function(d){return d3.format(".2f")(d)}));      
    // PRS graph: re-draw the line, according to the new data
    x = this.prsGraphXConfig;
    y = this.prsGraphYConfig;
    let prsLineNo1 = d3.select('#prsLineNo1')
    prsLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
              .attr("d", d3.line().x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.prs) })
                    );
    // PRS graph: relocate the Line No1 Label
    d3.select("#prsLine1Lab").attr("transform", "translate(" + (this.width+3) 
                                  + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].prs) + ")")


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
    d3.select("#tempLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].temp) + ")");

    // HUM graph: shift the domain,  according to new data
    this.humGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.humGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.hum; }))
    let humXDomain = d3.select("#humXDomain");
    let humYDomain = d3.select("#humYDomain");
    humXDomain.attr("transform", "translate(0," + this.height + ")")
              .transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisBottom(this.humGraphXConfig));
    humYDomain.transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisLeft(this.humGraphYConfig));
    // HUM graph: update the line, according to new data
    x = this.humGraphXConfig;
    y = this.humGraphYConfig;
    let humLineNo1 = d3.select('#humLineNo1')
    humLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
              .attr("d", d3.line().x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.hum) })
                    );
    // HUM graph: relocate the Line No1 Label
    d3.select("#humLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].hum) + ")");

    // PRS graph: shift the domain,  according to new data
    this.prsGraphXConfig.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.prsGraphYConfig.domain(d3.extent(weatherData, function(d) { return d.prs; }))
    let prsXDomain = d3.select("#prsXDomain");
    let prsYDomain = d3.select("#prsYDomain");
    prsXDomain.attr("transform", "translate(0," + this.height + ")")
              .transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisBottom(this.prsGraphXConfig));
    prsYDomain.transition()
              .duration(1000)
              .ease(d3.easeLinear,2)          
              .call(d3.axisLeft(this.prsGraphYConfig).tickFormat(function(d){return d3.format(".2f")(d)}));

    // PRS graph: update the line, according to new data
    x = this.prsGraphXConfig;
    y = this.prsGraphYConfig;
    let prsLineNo1 = d3.select('#prsLineNo1')
    prsLineNo1.datum(weatherData.filter(x => x.device == C_device.getDeviceNo1Name()))
              .attr("d", d3.line().x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.prs) })
                    );
    // PRS graph: relocate the Line No1 Label
    d3.select("#prsLine1Lab").attr("transform", "translate(" + (this.width+3) 
                              + "," + y(weatherData.filter(x => x.device == C_device.getDeviceNo1Name())[weatherData.length-1].prs) + ")");

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