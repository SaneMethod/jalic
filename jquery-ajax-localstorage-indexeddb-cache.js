/**
 * https://github.com/SaneMethod/jalic
 */
(function($, window){
    /**
     * Generate the cache key under which to store the local data - either the cache key supplied,
     * or one generated from the url, the type and, if present, the data.
     */
    var genCacheKey = function (options) {
        var url = options.url.replace(/jQuery.*/, '');

        // Strip _={timestamp}, if cache is set to false
        if (options.cache === false) {
            url = url.replace(/([?&])_=[^&]*/, '');
        }

        return options.cacheKey || url + options.type + (options.data || '');
    };

    /**
     * Determine whether we're using localStorage or, if the user has specified something other than a boolean
     * value for options.localCache, whether the value appears to satisfy the plugin's requirements.
     * Otherwise, throw a new TypeError indicating what type of value we expect.
     * @param {boolean|object} storage
     * @returns {boolean|object}
     */
    var getStorage = function(storage){
        if (!storage) return false;
        if (storage === true) return window.localStorage;
        if (typeof storage === "object" && 'getItem' in storage &&
            'removeItem' in storage && 'setItem' in storage)
        {
            return storage;
        }
        throw new TypeError("localCache must either be a boolean value, " +
            "or an object which implements the Storage interface.");
    };

    /**
     * Remove the item specified by cacheKey from local storage (but not from the IndexedDB, as in all usages
     * of this function we expect to overwrite the value with addToStorage shortly).
     * @param {Storage|object} storage
     * @param {string} cacheKey
     */
    var removeFromStorage = function(storage, cacheKey){
        storage.removeItem(cacheKey);
        storage.removeItem(cacheKey + 'cachettl');
    };

    var addToStorage = function(storage, cacheKey, ttl, data, dataType){
        var defer = $.Deferred();

        try{
            storage.setItem(cacheKey, 1);
            storage.setItem(cacheKey + 'cachettl', ttl);
        }catch(e){
            removeFromStorage(storage, cacheKey);
            defer.reject(e);

            return defer.promise();
        }

        return $.jidb.setItem(cacheKey, data, dataType);
    };

    /**
     * Prefilter for caching ajax calls.
     * See also $.ajaxTransport for the elements that make this compatible with jQuery Deferred.
     * New parameters available on the ajax call:
     * localCache   : true              - required - either a boolean (in which case localStorage is used),
     * or an object implementing the Storage interface, in which case that object is used instead.
     * cacheTTL     : 5,                - optional - cache time in hours, default is 5.
     * cacheKey     : 'myCacheKey',     - optional - key under which cached string will be stored
     * isCacheValid : function          - optional - return true for valid, false for invalid
     * @method $.ajaxPrefilter
     * @param options {Object} Options for the ajax call, modified with ajax standard settings
     */
    $.ajaxPrefilter(function(options){
        var storage = getStorage(options.localCache),
            hourstl = +new Date() + 1000 * 60 * 60 * (options.cacheTTL || 5),
            cacheKey = genCacheKey(options),
            cacheValid = options.isCacheValid,
            ttl,
            value;

        if (!storage) return;
        ttl = storage.getItem(cacheKey + 'cachettl');

        if (cacheValid && typeof cacheValid === 'function' && !cacheValid()){
            removeFromStorage(storage, cacheKey);
            ttl = 0;
        }

        if (ttl && ttl < +new Date()){
            removeFromStorage(storage, cacheKey);
            ttl = 0;
        }

        value = storage.getItem(cacheKey);
        if (!value){
            // If it not in the cache, we store the data, add success callback - normal callback will proceed
            if (options.success) {
                options.realsuccess = options.success;
            }
            options.success = function(data, status, jqXHR) {
                var dataType = this.dataType || jqXHR.getResponseHeader('Content-Type');

                // Save the data to storage, catching Storage exception and IndexedDB exceptions alike
                // and reject the returned promise as a result.
                addToStorage(storage, cacheKey, hourstl, data, dataType).done(function(){
                    if (options.realsuccess) options.realsuccess(data, status, jqXHR);
                }).fail(function(event){
                    console.log(event);
                });
            };
        }
    });

    /**
     * This function performs the fetch from cache portion of the functionality needed to cache ajax
     * calls and still fulfill the jqXHR Deferred Promise interface.
     * See also $.ajaxPrefilter
     * @method $.ajaxTransport
     * @params options {Object} Options for the ajax call, modified with ajax standard settings
     */
    $.ajaxTransport("+*", function(options){
        if (options.localCache)
        {
            var cacheKey = genCacheKey(options),
                storage = getStorage(options.localCache),
                value = (storage) ? storage.getItem(cacheKey) : false;

            if (value){
                // If the key is in the Storage-based cache, indicate that we want to handle this ajax request
                // (by returning a value), and use the cache key to retrieve the value from the IndexedDB. Then,
                // call the completeCallback with the fetched value.

                return {
                    send:function(headers, completeCallback) {
                        $.jidb.getItem(cacheKey).done(function(result){
                            var response = {};
                            response[result.dataType] = result.data;
                            completeCallback(200, 'success', response, '');
                        }).fail(function(){
                            completeCallback(500, 'cache failure', void 0, '');
                        });
                    },
                    abort:function() {
                        console.log("Aborted ajax transport for caching.");
                    }
                };
            }
        }
    });
})(jQuery, window);
