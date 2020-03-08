/****
 * 
 * 
 *  class for the page /weather
 * 
 * 
 */
class weatherPage{

    constructor(page){
      this.page = page;
      this.self = this;
      this.pageUrl = "weather";
      this.dtRange = "1m";
      
      this.data;
      this.dbSize;
    }
  
    /**
     * 
     * @private
     * @param {Object} rawData 
     * 
     */
    _setData(rawData){
      
      this.dbSize = rawData.size;
    
      let hrKeyName = "hour";
      let hrOffset = 1;
      let minKeyName = "min";
      let minOffset = 1;
      switch(this.dtRange.toString().toLowerCase() ){
  
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
  
      this.data = rawData.data.map(x => ({date: new Date(x._id.year,
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
  
    getWeatherData(){
  
      let self = this;
  
      return $.get(config.getapiURL(),  // getapiURL() is a statis method in config.js
      {
        dtRange :self.dtRange,
        type:'GET',
        dataType: 'json',
      },
      function (rawData){
  
        if(rawData.status.toString().toUpperCase() === "ERROR"){
  
          console.log(new Date().toLocaleString()
                      + ": " 
                      + "Fail; Get / " + this.pageUrl + "param={" + self.dtRange + "}; " 
                      + rawData.message.toString() 
                      );
        }else{
          console.log(new Date().toLocaleString()
                      + ": " 
                      + "Success; Get / " + this.pageUrl + "param={" + self.dtRange + "}." 
                      );
          self._setData(rawData);
        }
  
      }).done(function() {
        // for second success
  
      }).fail(function(xhr, status, error) {
        console.log(new Date().toLocaleString()
                    + ": " 
                    + status + "; "
                    + "Get / " + this.pageUrl + "param={" + self.dtRange + "}; "
                    + error.toString()
                    );
      }).always(function() {
          // for finished
      });
    }

    drawTempChart(weatherData){

        // set the dimensions and margins of the graph
        let margin = {top: 50, right: 50, bottom: 50, left: 70},
        maxWidth = 1100,
        maxHeight = 300,
        width = maxWidth - margin.left - margin.right,
        height = maxHeight - margin.top - margin.bottom,
        viewBoxSize = "0 0 " + maxWidth +" "+ maxHeight;
        
    
        d3.select("#tempChart").select("g").remove(); 
    
        // set SVG attributes 
        let svg = d3.select("#tempChart")
                    .attr("viewBox", viewBoxSize)            
        //.attr("width", maxWidth)
                    //.attr("height", maxHeight)
                    .append("g")
                    .attr("id","d3Group")
                    .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");
                  
        // add X axis
        let x = d3.scaleTime()
                  .domain(d3.extent(weatherData, function(d) { return d.date; }))
                  .range([ 0, width ]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        
        // add X axis label
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", width/2)
            .attr("y", height+margin.bottom - 5)   // -5 for the border
            //.attr("font-size","15px")
            .text("Datetime");
    
        // add Y axis
        let y = d3.scaleLinear()
                  .domain(d3.extent(weatherData, function(d) { return d.temp; }))
                  .range([ height, 0 ]);
        svg.append("g")
            .call(d3.axisLeft(y));
    
        // add Y axis label
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")    
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - height/2 + 50)  // 50 for text length
            .attr("y", 0 - margin.left/2 - 10)  // 10 for fine tuning
            //.attr("font-size","15px")
            .text("Temperature (°C)");
    
        // Add the line
        svg.append("path")
            .datum(weatherData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                          .x(function(d) { return x(d.date) })
                          .y(function(d) { return y(d.temp) })
                  )
    
    
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
        }
    
    } // end of drawTempChart


  }; // end of class
  
  /*** ****************** *****/
  /*                        */
  /*  for initization      */
  /*                        */
  /***************************/
  const C_thisPage = new weatherPage(this);
  C_thisPage.dtRange = '1h';
  (async () => {
    await C_thisPage.getWeatherData();
    C_thisPage.drawTempChart(C_thisPage.data);
  })();
