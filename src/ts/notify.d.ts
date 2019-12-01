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
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        protected constructor(userId: any, _errorCallback?: ((status: Number) => void) | null, isDebug?: boolean);
        /**
         * @param {string} channelName
         *
         * @returns {Object}
         */
        protected getChannel(channelName: string): any;
        /**
         * @param {string} channelName
         * @param eventName
         */
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
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        constructor(userId: any, _errorCallback?: ((status: Number) => void) | null, isDebug?: boolean);
        /**
         * @param {Object} data
         */
        handler(data: Object): void;
    }
    class Timer extends Notify {
        protected _errorCallback: ((status: Number) => void) | null;
        protected _markup: any;
        /**
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        constructor(userId: any, _errorCallback?: ((status: Number) => void) | null, isDebug?: boolean);
        /**
         * @param {string} message
         * @returns {boolean}
         */
        static timerIsPresent(message: string): boolean;
        /**
         * @param {Object} data
         */
        handler(data: Object): void;
    }
}
