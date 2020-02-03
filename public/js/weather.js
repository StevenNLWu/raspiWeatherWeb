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

  })();
