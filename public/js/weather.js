/****
 * 
 * 
 *  class for data, weather data from DB
 * 
 * 
 */
class C_data{

  constructor(){

    this.data;
    this.dbSize;

  }

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

  callApi2SelectRawData(dtRange){

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
                    + "Fail; Get / " + this.pageUrl + "param={" + dtRange + "}; " 
                    + rawData.message.toString() 
                    );
      }else{
        console.log(new Date().toLocaleString()
                    + ": " 
                    + "Success; Get / " + this.pageUrl + "param={" + dtRange + "}." 
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
 * 
 *  class for graph
 * 
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
   
    // label for X axis
    this.xLabel = "Datetime";
    this.yTempLabel = "Temperature (°C)";

    // the temp graph SVG 
    this.tempGraphSvg = d3.select("#tempChart")
                          .attr("viewBox", this.viewBoxSize)       
                          .append("g")
                          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")                     
  
    // add X axis label
    this.tempGraphSvg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("x", this.width/2)
                    .attr("y", this.height+this.margin.bottom - 5)   // -5 for the border
                    .text(this.xLabel);

    // add Y axis label
    this.tempGraphSvg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")    
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0 - this.height/2 + 50)  // 50 for text length
                    .attr("y", 0 - this.margin.left/2 - 10)  // 10 for fine tuning
                    .text(this.yTempLabel);


     // the temp grash X axis
    this.tempGraphX = d3.scaleTime().range([ 0, this.width ]);;
    // the temp grash Y axis
    this.tempGraphY = d3.scaleTime().range([ this.height, 0 ]);;

  } // end of constructor

  initGraph(weatherData){
            
    // init the X axis
    this.tempGraphX.domain(d3.extent(weatherData, function(d) { return d.date; }))                 
    this.tempGraphSvg.append("g")
                      .attr("id", "tempXDomain")    
                     .attr("transform", "translate(0," + this.height + ")")
                     .call(d3.axisBottom(this.tempGraphX));

    // init the Y axis
    this.tempGraphY.domain(d3.extent(weatherData, function(d) { return d.temp; }))             
    this.tempGraphSvg.append("g")
                      .attr("id", "tempYDomain")    
                     .call(d3.axisLeft(this.tempGraphY));

    // Add the line
    let x = this.tempGraphX;
    let y = this.tempGraphY;
    this.tempGraphSvg.append("path")
                    .datum(weatherData)
                    .attr("id", "tempLine")
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                                  .x(function(d) { return x(d.date) })
                                  .y(function(d) { return y(d.temp) })
                          );
/*
 // Create the circle that travels along the curve of chart
 let focus = svg.append('g')
                 .append('circle')
                 .style("fill", "none")
                 .attr('r', 4.5)
                 .attr("stroke", "red") 
                 .style("opacity", 0)

 // Create the text that travels along the curve of chart
 let focusText = svg.append('g')
                     .append('text')
                     .style("opacity", 0)
                     .attr("text-anchor", "left")
                     .attr("font-size", "14px")
                     .attr("stroke", "indianred") 
                     .attr("alignment-baseline", "middle");

 // Create a rect on top of the svg area: this rectangle recovers mouse position
 svg.append('rect')
     .style("fill", "none")
     .style("pointer-events", "all")
     .attr('width', width)
     .attr('height', height)
     .on("mouseover", function() { 
                       focus.style("opacity", 1)
                       focusText.style("opacity",1) 
                     }
     )
     .on("mouseout", function() { 
                     focus.style("opacity", 0)
                     focusText.style("opacity",0); 
                   }
     )
     .on("mousemove", mouseMove);

 function mouseMove() {

   // recover coordinate we need 
   const findSelectedDate = (callback)=>{

     let x0 = x.invert(d3.mouse(this)[0]);
     let index = d3.bisectLeft(weatherData.map(x => x.date), x0);
     let d0 = weatherData[index - 1];
     let d1 = weatherData[index];
     let selectedDate = x0 - d0.date > d1.date - x0 ? d1 : d0;
     callback( selectedDate);
   };

   findSelectedDate((selectedData)=>{

     let xText = selectedData.date.getFullYear() 
                 + "-"
                 + selectedData.date.getMonth()
                 + "-"
                 + selectedData.date.getDate()
                 + " "
                 +("0" + selectedData.date.getHours()).slice(-2)
                 + ":"
                 +("0" + selectedData.date.getMinutes()).slice(-2)
     let yText = parseFloat(selectedData.temp).toFixed(1);

     focus.attr("cx", x(selectedData.date))
           .attr("cy", y(selectedData.temp));

     focusText.html(xText)
               .attr("x", x(selectedData.date)+15)
               .attr("y", y(selectedData.temp))
               .attr('class', 'id')
               .append('svg:tspan')
               .attr("x", x(selectedData.date)+15)
               .attr("y", y(selectedData.temp)+20)
               .text(yText + "°C");
   })
   */
  } // end of function of initGraph

  switchGraph(weatherData){

      // re-draw domain, according to the new data
      this.tempGraphX.domain(d3.extent(weatherData, function(d) { return d.date; }))
      this.tempGraphY.domain(d3.extent(weatherData, function(d) { return d.temp; }))
      var tempXDomain = d3.select("#tempXDomain");
      var tempYDomain = d3.select("#tempYDomain");
      tempXDomain.attr("transform", "translate(0," + this.height + ")")
                  .call(d3.axisBottom(this.tempGraphX));

      tempYDomain.call(d3.axisLeft(this.tempGraphY));


      // re-draw the line, according to the new data
      let x = this.tempGraphX;
      let y = this.tempGraphY;
      var path = d3.select('#tempLine')
      path.datum(weatherData).attr("id", "tempLine")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line().x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.temp) })
            )





  } // end of function switchGraph
    
  updateData(weatherData){

    // update the line
    this.tempGraphX.domain(d3.extent(weatherData, function(d) { return d.date; }))
    this.tempGraphY.domain(d3.extent(weatherData, function(d) { return d.temp; }))
    let x = this.tempGraphX;
    let y = this.tempGraphY;
    var chart = d3.select('#tempChart')
    var path = d3.select('#tempLine')
    path.datum(weatherData).attr("id", "tempLine")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line().x(function(d) { return x(d.date) })
                  .y(function(d) { return y(d.temp) })
          )

    // Shift the chart left
    chart.select('g')
    .transition()
    .duration(1000)
    .ease(d3.easeLinear,2)
    .call(d3.axisBottom(this.tempGraphX));


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

  async clickMe(){

    // remember which date-range user clicked
    localStorage.setItem("dtRange", this.dtRange);

    // refresh the data
    //let c_d3Graph = this.c_d3Graph;
    //let weatherData = this.c_data.data;
    await this.c_data.callApi2SelectRawData(this.dtRange);
    this.c_d3Graph.switchGraph(this.c_data.data);
  }
} // end of class C_button


/*** ****************** *****/
/*                        */
/*  for initization      */
/*                        */
/***************************/
c_data = new C_data();
if(! (dtRange = localStorage.getItem('dtRange')))
  dtRange = "1h";
  c_data.callApi2SelectRawData(dtRange);


(async () => {
  await c_data.callApi2SelectRawData(dtRange);
  c_d3Graph = new C_d3Graph();
  c_d3Graph.initGraph(c_data.data);

    c_bt1h = new C_button("1h", c_d3Graph);
    c_bt12h = new C_button("12h", c_d3Graph);
    c_bt1d = new C_button("1d", c_d3Graph);
    c_bt7d = new C_button("7d", c_d3Graph);
    c_bt1m = new C_button("1m", c_d3Graph);
    c_bt6m = new C_button("6m", c_d3Graph);
    c_bt1y = new C_button("1y", c_d3Graph);
   
})();




 /*
 C_thisPage.readtimeDataLoading();

*/