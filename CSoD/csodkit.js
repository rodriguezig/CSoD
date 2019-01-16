
var CsodApi = function(config) {
    this.config = config;
}

/*
 This is a function to format the date into the format the CSOD API uses for
 API headers.
 */
CsodApi.prototype.getUtcDate = function(date) {
    var year = date.getUTCFullYear().toString();
    var month = (date.getUTCMonth() + 1).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    var day = date.getUTCDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }
    var hours = date.getUTCHours().toString();
    if (hours.length == 1) {
        hours = "0" + hours;
    }
    var minutes = date.getUTCMinutes().toString();
    if (minutes.length == 1) {
        minutes = "0" + minutes;
    }
    var seconds = date.getUTCSeconds().toString();
    if (seconds.length == 1) {
        seconds = "0" + seconds;
    }
    var milli = date.getUTCMilliseconds().toString();
    if (milli.length <= 1) {
        milli = "0" + milli;
    }
    if (milli.length == 2) {
        milli = "0" + milli;
    }

    return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + ".000";

}

CsodApi.prototype.getApiSignature = function(url, apiToken, apiSecret, httpVerb, utc) {
    var stringToSign = httpVerb + "\n" + "x-csod-api-key:" + apiToken 
        + "\n" + "x-csod-date:" + new String(utc) + "\n" 
        + url;
        
  return this.getSignature(this.config.apiSecret, stringToSign);
}

CsodApi.prototype.getSignature = function(apiSecret, stringToSign) {
    //creates the signature using the Node crypto library
    /*
    var secret64    = CryptoJS.enc.Base64.parse(apiSecret);
    var queryUTF8   = CryptoJS.enc.Utf8.parse(stringToSign);
    var hash        = CryptoJS.HmacSHA512(queryUTF8, secret64);
        
    var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
    
    return hashInBase64;
    */
    var secretKey   = CryptoJS.enc.Base64.parse(apiSecret);
    var hash        = CryptoJS.HmacSHA512(stringToSign, secretKey);
    var signature   = hash.toString(CryptoJS.enc.Base64);

    return signature;
}

/*
 This function returns the correct CSOD headers for a request to the API
 portal: yourPortal.csod.com
 url: the relative URL of the service you are calling
 sessionToken: the session token for the API key
 sessionSecret: the session secret for the api key
 httpVerb: GET, POST, PUT

 */
CsodApi.prototype.generateSession = function(onSuccess, onfail) {
    var relativeUrl = "/services/api/sts/Session";
    var url = /*'https://' + */ this.config.portal + relativeUrl + '?userName=' + this.config.userName + "&alias=" + this.config.sessionName;
    
    var utc = this.getUtcDate(new Date());
    var signature = this.getApiSignature(relativeUrl, this.config.apiKey, this.config.apiSecret, "POST", utc);

    var config = this.config;
    var options = {
            url : url,
            headers: {
                'x-csod-date'       : utc,
                'x-csod-api-key'    : this.config.apiKey,
                'x-csod-signature'  : signature
            },
            type        : "POST",
            contentType : "text/xml",
            dataType    : "text/xml",
            success     : function (msg) {
                /***** Recuperamos el Tk *****/
                try{
                    // Lo devuelve como XML
                    config.sessionToken = $('a\\:Token, Token', msg.documentElement).text();
                    config.sessionSecret= $('a\\:Secret, Secret', msg.documentElement).text();
                    config.ExpiresOn    = $('a\\:ExpiresOn, ExpiresOn', msg.documentElement).text();
                } catch (ex) { }
                
                if (typeof(onSuccess) == 'function')
                    onSuccess(msg);
            },
            error       : function (msg) {
                if (typeof(onfail) == 'function')
                    onfail(msg);
            }
        };

    return options;
}

/*
 This function returns the correct CSOD headers for a request to the API
 portal: yourPortal.csod.com
 url: the relative URL of the service you are calling
 sessionToken: the session token for the API key
 sessionSecret: the session secret for the api key
 httpVerb: GET, POST, PUT

 */
CsodApi.prototype.getCSODHeaders = function(relativeUrl, httpVerb, params, onSuccess, onfail) {
    var utc = this.config.ExpiresOn != null ? this.config.ExpiresOn : this.getUtcDate(new Date());

    var stringToSign = httpVerb + "\n" + "x-csod-date:" + new String(utc)
        + "\n" + "x-csod-session-token:" + this.config.sessionToken + "\n"
        + relativeUrl;

    //creates the signature using the Node crypto library
    var signature = this.getSignature(this.config.sessionSecret, stringToSign);

    var options = {
            url : this.config.portal + relativeUrl + (typeof(params) != 'undefined' ? params : ''),
            headers: {
                'x-csod-date'           : utc,
                'x-csod-session-token'  : this.config.sessionToken,
                'x-csod-signature'      : signature
            },
            type        : httpVerb,
            contentType : "text/xml",
            dataType    : "text/xml",
            success     : function (msg) {
                if (typeof(onSuccess) == 'function')
                    onSuccess(msg);
            },
            error       : function (msg) {
                if (typeof(onfail) == 'function')
                    onfail(msg);
            }
        };

    return options;
}

CsodApi.prototype.getData = function(relativeUrl, query, callback, error){
    
    if(this.config.sessionSecret == null || this.config.sessionToken == null){
        var rest = {
            onSuccess   : function(data, callBack) {
                try{console.log('LOGIN CSoD API REST');}catch(ex){}
            },
            onFail      : function(data, callBack) {
                try{console.log('ERROR CSoD API REST: ' + data);}catch(ex){}
            }
        };
        
        var options = this.generateSession(rest.onSuccess, rest.onFail);
            extQuery$.ajax({
                url     : options['url'],
                async   : false,                //-> Esperamos a que conteste el servidor. Ya que necesitamos primero tener sesión.
                headers : options['headers'],
                type    : options['type'],
                contentType : options['contentType'],
                error       : options['error']
            });
    
    }
    
    return this.getServiceData(relativeUrl, query, callback, error);
}

CsodApi.prototype.getServiceData = function(relativeUrl, query, callback, error){
    //I am doing a read, so I use the GET verb
    var httpVerb    = 'GET';
    var relativeUrl = relativeUrl || '/services/api/sts/Session';

        //need to URL encode spaces in odata query
        if(query != null) {
            var find    = new RegExp(' ', 'g');
            var encodedQuery = query.replace(find, '%20');
            query = (query != null) ? '?' + encodedQuery : '';
        }

    return this.getCSODHeaders(relativeUrl, httpVerb, query, callback, error);

}
