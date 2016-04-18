Jalic
-----
jquery-ajax-localstorage-indexeddb-cache - abbreviated Jalic from here on, because the full name is a mouthful.

This plugin offers two major enhancements:

1) Enhancement of the jquery ajax transports to allow for sending and receiving
[Blobs](https://developer.mozilla.org/en/docs/Web/API/Blob) and
[ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) using
the familiar ajax methods, complete with Promise support.

2) Caching of ajax request return values, including blobs and arraybuffers, using IndexedDB and LocalStorage (or
another Storage interface compatible object).

Jalic is a plugin built for jQuery (> 1.5.1), [browsers that support](http://caniuse.com/#feat=indexeddb)
unprefixed/non-experimental versions of [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API),
and any object implementing the [storage interface](https://developer.mozilla.org/en-US/docs/Web/API/Storage), such as
[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

It's built on a fork from [Jalc](https://github.com/SaneMethod/jquery-ajax-localstorage-cache), and should be
considered experimental at the moment - error handling is all but absent, and many edge cases (such as using
[IndexedDB in Firefox Privacy Mode](https://bugzilla.mozilla.org/show_bug.cgi?id=781982)) are not supported with any
fallbacks. Pull requests are welcome.


# Usage

## Parameters
```javascript
	$.ajax({
		url          : '/post',
		dataType     : 'blob',      // Required if you're expecting to receive a blob or arraybuffer - no type guessing
		processData  : false,       // Required only if you're sending a blob or arraybuffer
		localCache   : true,        // Required to use caching. Can be a boolean for LocalStorage, or an object which
		                            // implements the Storage interface.
		cacheTTL     : 5,           // Optional. In hours. Default is 5.
		cacheKey     : 'cacheKey',  // Optional.
		isCacheValid : function(){  // Optional function to determine whether cache is still valid. Must return
			return true;            // synchronously. Return truthy for valid, falsey for invalid.
		}
	}).done(function(response){
	    // The response is available here.
	});
```
On your AJAX request you get 4 new parameters:

* localCache
	* Turn localCache on/off, or specify an object implementing the Storage interface to use.
	* Default: false
* cacheTTL
    * time in hours the entry should be valid. 
    * only for this specific ajax request
    * Default : 5 hours
* cacheKey
	* CacheKey is the key that will be used to store the response in localStorage.
	* Default: URL + TYPE(GET/POST) + DATA
* isCacheValid
	* This function must return true or false (or trthy or falsey values). If falsey, the cached response is removed.
	* Default: null

Additionally, the ```dataType``` parameter can now be specified with 'blob' or 'arraybuffer'. If sending a blob or
arraybuffer, remember to also set the ```processData``` parameter to ```false```.

## Notes

* The plugin adds a new object with a Storage-like interface to the global jQuery object, $.jidb. The main difference
 is that all methods (e.g. ```setItem```, ```removeItem```, etc.) return $.Deferred promises, and execute
 asynchronously.
* You can delete the cache database and its contents via ```$.jidb.clear()```.
* You can pre-load content with this plugin. You just have do to an initial AJAX request with the same
cacheKey.
* You should specify the ```dataType``` parameter on all ajax requests.


# License

This project is distributed under Mozilla Public License version 2. See LICENSE.txt for more information.
