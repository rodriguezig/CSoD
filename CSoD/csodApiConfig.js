/**
 * Created by dhoffman on 1/11/2015.
 */

/**
 *
 * @constructor
 */

var CsodConfig = function(userName) {
    /*This is your CSOD username. Assuming this is your
     corporate system, there will need to be a mapping between your user id
     and the CSOD username if you want to user the method below
     */

    this.apiKey     = document.location.host.indexOf('-pilot.') != -1 ? '%%xxxxxxxxx%x' : document.location.host.indexOf('-stg.') != -1 ? '%%xxxxxxxxx%x' : '%%xxxxxxxxx%x';
    this.apiSecret  = document.location.host.indexOf('-pilot.') != -1 ? '%XXxXxxX%XX%/Xx%x%+xXxXxXxXxXxXXxxXxXXxxX%XxXxXXXXxxXxxXxxxxx%x%xX%xxxxx/xxXxX+XxX%XxX==' : document.location.host.indexOf('-stg.') != -1 ? '%XXxXxxX%XX%/Xx%x%+xXxXxXxXxXxXXxxXxXXxxX%XxXxXXXXxxXxxXxxxxx%x%xX%xxxxx/xxXxX+XxX%XxX==' : '%XXxXxxX%XX%/Xx%x%+xXxXxXxXxXxXXxxXxXXxxX%XxXxXXXXxxXxxXxxxxx%x%xX%xxxxx/xxXxX+XxX%XxX==';
    
    this.userName       = typeof(userName) != 'undefined' ? userName : 'admin';
    this.sessionName    = this.userName + (new Date()).getTime();

    this.sessionToken   = null;
    this.sessionSecret  = null;
    this.ExpiresOn      = null;

    //put the portal you want to access here
    this.portal         = document.location.origin;

}

