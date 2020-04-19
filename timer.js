
module.exports = class TimeFormat{

    getCurrentLocaltime(){
        let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        let localTime = (new Date(Date.now() - tzoffset))

        return localTime;
    }

    getCurrentLocaltimeInIso(replaceMSecond=false, replaceZ=false){
        let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        let localISOTime = (new Date(Date.now() - tzoffset)).toISOString()

        if(replaceMSecond)
            localISOTime = localISOTime.replace(/\..+/, '')+"Z";
        if(replaceZ)
            localISOTime = localISOTime.slice(0, -1);

        return localISOTime;
    }

    convert2Iso(datetime, replaceMSecond=false, replaceZ=false){
        let isoTime = (new Date(datetime)).toISOString()
        
        if(replaceMSecond)
            isoTime = isoTime.replace(/\..+/, '')+"Z";
        if(replaceZ)
            isoTime = isoTime.slice(0, -1);

        return isoTime;
    }

    convert2IsoInLocaltimeZone(datetime, replaceMSecond=false, replaceZ=false){
        let tzoffset = datetime.getTimezoneOffset() * 60000; //offset in milliseconds
        let localISOTime = (new Date(datetime - tzoffset)).toISOString()
        
        if(replaceMSecond)
            localISOTime = localISOTime.replace(/\..+/, '')+"Z";
        if(replaceZ)
            localISOTime = localISOTime.slice(0, -1);

        return localISOTime;
    }
}