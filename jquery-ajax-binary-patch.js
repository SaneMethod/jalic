/**
 * https://gist.github.com/SaneMethod/7548768
 * Put into place our patch to allow jquery ajax to handle binary data types
 * for sending and receiving blobs and arraybuffers.
 */
(function($){
    /**
     * Register ajax transports for blob send/recieve and array buffer send/receive via XMLHttpRequest Level 2
     * within the comfortable framework of the jquery ajax request, with full support for promises.
     *
     * Remember to specify 'processData:false' in the ajax options when attempting to send a blob or arraybuffer -
     * otherwise jquery will try (and fail) to convert the blob or buffer into a query string.
     */
    $.ajaxTransport("+*", function(options, originalOptions, jqXHR){
        /**
         * Test for the conditions that mean we can/want to send/receive blobs or arraybuffers - we need XMLHttpRequest
         * level 2 (so feature-detect against window.FormData), feature detect against window.Blob or
         * window.ArrayBuffer, and then check to see if the dataType is blob/arraybuffer or the data itself is
         * a Blob/ArrayBuffer.
         */
        if (window.FormData &&
            ((options.dataType && (options.dataType == 'blob' || options.dataType == 'arraybuffer')) ||
            (options.data && ((window.Blob && options.data instanceof Blob) ||
            (window.ArrayBuffer && options.data instanceof ArrayBuffer)))))
        {
            var xhr;

            return {
                /**
                 * Return a transport capable of sending and/or receiving blobs - in this case, we instantiate
                 * a new XMLHttpRequest and use it to actually perform the request, and funnel the result back
                 * into the jquery complete callback (such as the success function, done blocks, etc.)
                 *
                 * @param {object} headers
                 * @param {function} completeCallback
                 */
                send: function(headers, completeCallback){
                    var url = options.url || window.location.href,
                        type = options.type || 'GET',
                        dataType = options.dataType || 'text',
                        data = options.data || null,
                        // Intentionally always true - ajax sync requests are deprecated.
                        async = options.async || true;

                    xhr = new XMLHttpRequest();
                    xhr.addEventListener('load', function(){
                        var res = {},
                            success = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;

                        if (success){
                            res[dataType] = xhr.response;
                        } else {
                            res.text = xhr.statusText;
                        }

                        completeCallback(xhr.status, xhr.statusText, res, xhr.getAllResponseHeaders());
                    });

                    xhr.open(type, url, async);
                    xhr.responseType = dataType;

                    for (var key in headers){
                        if (headers.hasOwnProperty(key)){
                            xhr.setRequestHeader(key, headers[key]);
                        }
                    }

                    xhr.send(data);
                },
                abort: function(){
                    if (xhr){
                        xhr.abort();
                    }
                }
            };
        }
    });
})(jQuery);