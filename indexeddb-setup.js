(function($, window){
    var idb = window.indexedDB,
        dbReady = $.Deferred(),
        db;

    if (!window.indexedDB) throw new Error("Expecting unprefixed IndexedDB support on window object.");

    function createDatabase(idb){
        var dbreq = idb.open('jalic', 1);

        dbreq.onerror = function(event){
            console.log(event);
            dbReady.reject(event);
        };

        /**
         * The on upgrade needed event is called whenever we're opening a database with a version number
         * higher than the currently existing version number, which includes when the database doesn't
         * currently exist. Within this function we define the structure of the db.
         * @param event
         */
        dbreq.onupgradeneeded = function(event){
            var objectStore;

            db = event.target.result;
            db.onerror = function(event){
                console.log(event);
            };

            objectStore = db.createObjectStore('jalicData', {keyPath:"jdName"});
            objectStore.createIndex('storedAt', 'storedAt', {unique:false});

            objectStore.transaction.oncomplete = function(event){
                dbReady.resolve();
            };
        };

        dbreq.onsuccess = function(event){
            db = event.target.result;
            dbReady.resolve();
        };

        return dbReady.promise();
    }

    /**
     * Create the database and call any functions that are awaiting its availability when done.
     */
    createDatabase(idb);

    /**
     * Define a simple interface mimicking the Storage interface on the jQuery object.
     */
    $.jidb = {
        /**
         * Set an item withn the jalicData objectStore, using the given jdName and data, with optionally
         * a dataType parameter to store alongside the data. If dataType is not provided, it is the result of
         * typeof data.
         * @param jdName
         * @param data
         * @param dataType
         * @returns {$.Deferred} Returns a jQuery Deferred object, which resolves with an empty body on success,
         * or else resolves with the transaction or request error on failure.
         */
        setItem:function(jdName, data, dataType){
            var defer = $.Deferred(),
                transaction = db.transaction(['jalicData'], 'readwrite'),
                objectStore = transaction.objectStore("jalicData"),
                request;

            dataType = dataType || typeof data;

            transaction.oncomplete = function(){
                return defer.resolve();
            };

            transaction.onerror = function(event){
                console.log(event);
                return defer.reject(event);
            };

            request = objectStore.put({jdName:jdName, storedAt:+new Date(), dataType:dataType, data:data});

            request.onerror = function(event){
                console.log(event);
                defer.reject(event);
            };

            return defer.promise();
        },
        /**
         * Retrieve an item from the jalicData objectStore, using the given jdName as the key.
         * @param jdName
         * @returns {$.Deferred} Returns a jQuery Deferred object, which resolves with the request result as an object
         * on success, or else resolves with the transaction or request error on failure.
         */
        getItem:function(jdName){
            var defer = $.Deferred(),
                transaction = db.transaction(['jalicData'], 'readonly'),
                objectStore = transaction.objectStore('jalicData'),
                request = objectStore.get(jdName);

            request.onerror = function(event){
                console.log(event);
                defer.reject(event);
            };

            request.onsuccess = function(event){
                defer.resolve(request.result);
            };

            return defer.promise();
        },
        /**
         * Remove an item from the jalicData objectStore, using the given jdName as the key.
         * @param jdName
         * @returns {$.Deferred} Returns a jQuery Deferred object, which resolves with an empty body on success,
         * or else resolves with the transaction or request error on failure.
         */
        removeItem:function(jdName){
            var defer = $.Deferred(),
                transaction = db.transaction(['jalicData'], 'readwrite'),
                objectStore = transaction.objectStore('jalicData'),
                request = objectStore.delete(jdName);

            request.onerror = function(event){
                console.log(event);
                defer.reject(event);
            };

            request.onsuccess = function(){
                defer.resolve();
            };

            return defer.promise();
        },
        /**
         * Delete the jalic database and recreate it.
         * @returns {$.Deferred} Returns a jQuery Deferred object, which resolves with an empty body on success,
         * or else resolves with the transaction or request error on failure.
         */
        clear:function(){
            var defer = $.Deferred(),
                request = idb.deleteDatabase('jalic');

            dbReady = $.Deferred();

            request.onerror = function(event){
                console.log(event);
                defer.reject(event);
            };

            request.onsuccess = function(){
                dbReady.done(function(){
                    defer.resolve();
                });

                createDatabase(idb);
            };

            return defer.promise();
        }
    };
})(jQuery, window);