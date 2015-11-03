// Freely inspired from https://github.com/bitwiseshiftleft/sjcl/blob/23cd0dee310a339b5b40e32924f0e91cd27967c6/core/random.js
// and from http://phrack.org/issues/59/15.html
prng = function() {
    this._collectionStarted = false;
    this._entropyPool = new Uint8Array();
    this._entropyPoolSize = 0;
    this._entropyEstimation = 0;

    /* Constants */
    this._ENTROPY_POOL_SIZE = 32; // Size of the entropy pool in byte
    this._ENTROPY_THRESHOLD = 512; // Number of entropy bytes to gather

    /* Events constants */
    this.PROGRESS_EVENT = "dicewarepwd.progress";
    this.READY_EVENT = "dicewarepwd.ready";
};

prng.prototype = {

    _addEntropy: function(data, estimatedEntropy, source) {
        source = source || "user";
        if (source === "mouse") {
            this._addEntropyFromMouse(data, estimatedEntropy);
        } else if (source === "touch") {
            this._addEntropyFromTouch(data, estimatedEntropy);
        } else {
            //console.log(data + estimatedEntropy + source);
        }
    },

    _addEntropyFromMouse: function(data, estimatedEntropy) {
        x = data[0] & 0xF; // Keep only the 4 most significant bits
        y = data[1] & 0xF; // Keep only the 4 most significant bits
        t = data[2] * 10; // The timestamp using tenth of milliseconds to improve entropy
        r = float2int(t) & 0xFF; // Keep only the 8 most significant bits
        entropy = ((x << 4) | y) ^ r; // e is 8 bits long and it's the new added entropy
        // console.log(e.toString(2));
        this._updateEntropy(entropy, estimatedEntropy);
    },

    _addEntropyFromTouch: function(data, estimatedEntropy) {
        x = data[0] & 0xF; // Keep only the 4 most significant bits
        y = data[1] & 0xF; // Keep only the 4 most significant bits
        t = data[2] * 10; // The timestamp using tenth of milliseconds to improve entropy
        r = float2int(t) & 0xFF; // Keep only the 8 most significant bits
        entropy = ((x << 4) | y) ^ r; // e is 8 bits long and it's the new added entropy
        // console.log(e.toString(2));
        this._updateEntropy(entropy, estimatedEntropy);
    },

    _updateEntropy: function(entropy, estimatedEntropy) {
        wasReady = this.isReady();
        this._updateEntropyPool(entropy, estimatedEntropy);
        if (!wasReady && this.isReady()) {
            this._notifyEntropyCollectionDone();
        } else if (!this.isReady()) {
            this._notifyEntropyCollectionProgress(this._entropyEstimation, this._ENTROPY_THRESHOLD);
        }
    },

    /** Update entropy pool.
     * Entropy pool is _ENTROPY_POOL_SIZE long of bytes
     * @param {number} entropy a new byte of entropy.
     * @param {number} estimatedEntropy the estimated entropy added to the entropy pool.
     */
    _updateEntropyPool: function(entropy, estimatedEntropy) {
        this._entropyPoolSize %= this._ENTROPY_POOL_SIZE;
        this._entropyPool[this._entropyPoolSize] ^= entropy;
        this._entropyEstimation += estimatedEntropy;
        if (this._entropyPoolSize == 0) {
            // console.log(this._entropyPool + " / " + this._entropyEstimation)
        }
        this._entropyPoolSize++;
    },

    isReady: function() {
        return this._entropyEstimation >= this._ENTROPY_THRESHOLD;
    },

    entropy: function() {
        return this._entropyPool;
    },

    _notifyEntropyCollectionProgress: function(entropyEstimation, entropyTargetted) {

        p = float2int((entropyEstimation / entropyTargetted) * 100);
        this.dispatchEvent({
            type: this.PROGRESS_EVENT,
            percent: p
        });
    },

    _notifyEntropyCollectionDone: function() {
        this.dispatchEvent({
            type: this.READY_EVENT
        });
    },

    startCollection: function() {
        if (this._collectionStarted) {
            return;
        }

        this._entropyPool = new Uint8Array(this._ENTROPY_POOL_SIZE);
        this._entropyPoolSize = 0;
        this._entropyEstimation = 0;

        this._eventListener = {
            mouseCollector: this._bind(this._mouseCollector),
            accelerometerCollector: this._bind(this._accelerometerCollector),
            touchCollector: this._bind(this._touchCollector)
        };

        if (window.addEventListener) {
            window.addEventListener("mousemove", this._eventListener.mouseCollector, false);
            window.addEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
            window.addEventListener("touchmove", this._eventListener.touchCollector, false);
        } else if (document.attachEvent) {
            document.attachEvent("onmousemove", this._eventListener.mouseCollector);
        } else {
            throw "can't attach event";
        }

        this._collectionStarted = true;
    },

    stopCollection: function() {
        if (!this._collectionStarted) {
            return;
        }
        if (window.removeEventListener) {
            window.removeEventListener("mousemove", this._eventListener.mouseCollector, false);
            window.removeEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
            window.removeEventListener("touchmove", this._eventListener.touchCollector, false);
        } else if (document.detachEvent) {
            document.detachEvent("onmousemove", this._eventListener.mouseCollector);
        }
        this._collectionStarted = false;
    },

    _mouseCollector: function(ev) {
        var x, y;

        try {
            x = ev.x || ev.clientX || ev.offsetX || 0;
            y = ev.y || ev.clientY || ev.offsetY || 0;
        } catch (err) {
            // Event originated from a secure element. No mouse position available.
            x = 0;
            y = 0;
        }

        if (x != 0 && y != 0) {
            t = window.performance.now()
            this._addEntropy([x, y, t], 2, "mouse");
        }
    },

    _touchCollector: function(ev) {
        var touch = ev.touches[0] || ev.changedTouches[0];
        var x = touch.pageX || touch.clientX,
            y = touch.pageY || touch.clientY;

        t = window.performance.now()
        this._addEntropy([x, y, t], 1, "touch");
        ev.preventDefault();
    },

    _accelerometerCollector: function(ev) {
        var ac = ev.accelerationIncludingGravity.x || ev.accelerationIncludingGravity.y || ev.accelerationIncludingGravity.z;
        if (window.orientation) {
            var or = window.orientation;
            if (typeof or === "number") {
                this._addEntropy(or, 1, "accelerometer");
            }
        }
        if (ac) {
            this._addEntropy(ac, 2, "accelerometer");
        }
    },

    // Bind a function to its context
    // Read this http://stackoverflow.com/a/15455043/21052
    // Read also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    _bind: function(func) {
        var that = this;
        return function() {
            func.apply(that, arguments);
        };
    },
};

// Add events methods to the prng object
EventDispatcher.prototype.apply(prng.prototype);

// Create the PRNG
random = new prng();
