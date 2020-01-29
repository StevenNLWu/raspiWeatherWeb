
module.exports = class TimeFormat{

    getCurrentLocaltimeInIso(replaceMSecond){
        let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        let localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
        
        if(replaceMSecond)
            return localISOTime.replace(/\..+/, '');

        return localISOTime;
    }

    convert2IsoInLocaltimeZone(datetime, replaceMSecond){
        let tzoffset = datetime.getTimezoneOffset() * 60000; //offset in milliseconds
        let localISOTime = (new Date(datetime - tzoffset)).toISOString().slice(0, -1);
        
        if(replaceMSecond)
            return localISOTime.replace(/\..+/, '');

        return localISOTime;
    }
}