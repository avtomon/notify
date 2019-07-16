export declare namespace Notify {
    abstract class Notify {
        protected _errorCallback: ((status: Number) => void) | null;
        _ready: Promise<any>;
        /**
         * @type Pusher
         */
        protected _pusher: any;
        /**
         * @type {string[]}
         *
         * @private
         */
        protected _channels: string[];
        /**
         * @param {(status: Number) => void} _errorCallback
         */
        protected constructor(_errorCallback?: ((status: Number) => void) | null);
        /**
         * @param {string} channelName
         *
         * @returns {Object}
         */
        protected getChannel(channelName: string): Object;
        subscribe(channelName: string, eventName: any): void;
        /**
         * @param {string} channelName
         * @param eventName
         */
        unsubscribe(channelName: string, eventName: any): void;
        /**
         * @returns {Promise}
         */
        whenReady(): Promise<any>;
        /**
         * @param {Object} data
         */
        abstract handler(data: Object): void;
    }
    class Message extends Notify {
        protected _errorCallback: ((status: Number) => void) | null;
        protected _markup: any;
        /**
         * @param {((status: Number) => void) | null} _errorCallback
         */
        constructor(_errorCallback?: ((status: Number) => void) | null);
        /**
         * @param {Object} data
         */
        handler(data: Object): void;
    }
    class Timer extends Notify {
        protected _errorCallback: ((status: Number) => void) | null;
        protected _markup: any;
        /**
         * @param {((status: Number) => void) | null} _errorCallback
         */
        constructor(_errorCallback?: ((status: Number) => void) | null);
        /**
         * @param {Object} data
         */
        handler(data: Object): void;
    }
}
