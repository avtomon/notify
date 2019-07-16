'use strict';

import {Utils} from "../../../good-funcs.js/src/ts/GoodFuncs.js";

const
    PUSHER_TOKEN = 'fce413303b17a4879b88',
    AUTH_ENDPOINT = '/user/pusher-auth-test',
    ENCRYPTION_KEY = 'JFd0654',
    MESSAGE_DEFAULT_DISPLAY_LENGTH = 10000,
    TIMER_DEFAULT_DISPLAY_LENGTH = 1800000;

let defaultToastSettings = {
    html: '',
    displayLength: MESSAGE_DEFAULT_DISPLAY_LENGTH,
    classes: 'notify'
};

export namespace Notify {

    import GoodFuncs = Utils.GoodFuncs;

    abstract class Notify {

        _ready : Promise<any>;

        /**
         * @type Pusher
         */
        protected _pusher;

        /**
         * @type {string[]}
         *
         * @private
         */
        protected _channels : string[] = [];

        /**
         * @param {(status: Number) => void} _errorCallback
         */
        protected constructor(protected _errorCallback : ((status : Number) => void) | null = null) {

            this._ready = Promise.all(GoodFuncs.getScripts(['https://js.pusher.com/4.4/pusher.min.js'])).then(function () {

                this._pusher = new Pusher(PUSHER_TOKEN, {
                    cluster: 'eu',
                    forceTLS: true,
                    authEndpoint: AUTH_ENDPOINT,
                    encryptionMasterKey: ENCRYPTION_KEY
                });


            }.bind(this));
        }

        /**
         * @param {string} channelName
         *
         * @returns {Object}
         */
        protected getChannel(channelName : string) : Object {

            if (!this._channels[channelName]) {
                this._channels[channelName] = this._pusher.subscribe(channelName);
                this._channels[channelName].bind('pusher:subscription_error', function (status) {
                    if (status >= 400) {
                        this._errorCallback(status);
                    }
                }.bind(this));
            }

            return this._channels[channelName];
        }

        public subscribe(channelName : string, eventName) : void {

            let channel = this.getChannel(channelName);
            channel.bind(eventName, function (data) {

                this.handler(data);
            }.bind(this));
        }

        /**
         * @param {string} channelName
         * @param eventName
         */
        public unsubscribe(channelName : string, eventName) {

            if (!this._channels[channelName]) {
                return;
            }

            this._channels[channelName].unbind(eventName);
        }

        /**
         * @returns {Promise}
         */
        public whenReady() : Promise<any> {
            return this._ready;
        }

        /**
         * @param {Object} data
         */
        abstract handler(data : Object) : void;
    }

    export class Message extends Notify {

        protected _markup;

        /**
         * @param {((status: Number) => void) | null} _errorCallback
         */
        public constructor(protected _errorCallback : ((status : Number) => void) | null = null) {

            super(_errorCallback);
            let self = this;
            this._ready = this._ready.then(function () {
                fetch('/vendor/avtomon/notify.js/dist/html/message.html').then(async function (response) {
                    self._markup = await response.text();
                    Utils.GoodFuncs.addCss(['/vendor/avtomon/notify.js/dist/css/message.css']);
                });
            }).then();
        }

        /**
         * @param {Object} data
         */
        public handler(data : Object) : void {

            if (!data['message']) {
                throw Error("Received data don't contains message property");
            }

            let html = (new DOMParser).parseFromString(this._markup, 'text/html'),
                textElement : HTMLElement = html && (html.querySelector('.text') as HTMLElement),
                iconContainer = html && (html.querySelector('.icon-container') as HTMLElement),
                toastSettings = defaultToastSettings;

            textElement.innerHTML = data['message'];
            iconContainer.classList.add(data['status']);
            toastSettings.html = html.body.innerHTML;

            M.toast(toastSettings);
        }
    }

    export class Timer extends Notify {

        protected _markup;

        /**
         * @param {((status: Number) => void) | null} _errorCallback
         */
        public constructor(protected _errorCallback : ((status : Number) => void) | null = null) {

            super(_errorCallback);
            let self = this;
            this._ready = this._ready.then(function () {
                fetch('/vendor/avtomon/notify.js/dist/html/timer.html').then(async function (response) {
                    self._markup = await response.text();
                    Utils.GoodFuncs.addCss(['/vendor/avtomon/notify.js/dist/css/timer.css']);
                });
            }).then();
        }

        /**
         * @param {Object} data
         */
        public handler(data : Object) : void {

            if (!data['start_time'] || !data['message']) {
                throw Error("Received data don't contains start_time property");
            }

            let html = (new DOMParser).parseFromString(this._markup, 'text/html'),
                uniq = 'timer-' + Utils.GoodFuncs.getRandomString(12),
                toastSettings = defaultToastSettings;

            toastSettings.classes = `${toastSettings.classes} ${uniq}`;
            toastSettings.html = html.body.innerHTML;
            toastSettings.displayLength = TIMER_DEFAULT_DISPLAY_LENGTH;

            let toastInstance = M.toast(toastSettings),
                toast : HTMLElement = (document.querySelector('.' + uniq) as HTMLElement),
                timerElement = (toast.querySelector('.timer') as HTMLElement),
                iconContainer = (toast.querySelector('.icon-container') as HTMLElement),
                seconds = data['start_time'],
                tick = function () {
                    let time = new Date(0, 0, 0, 0, 0, seconds--);
                    timerElement.innerText = time.toLocaleTimeString();
                    if (seconds === 0) {
                        timerElement.animate({
                            opacity: [0, 1]
                        }, {
                            duration: 100,
                            fill: 'forwards',
                            iterations: 3
                        });

                        toastInstance.dismiss();
                        return;
                    }

                    if (!data['limits']) {
                        return;
                    }

                    if (seconds < data['limits']['low']) {
                        iconContainer.classList.add('alarm');
                        iconContainer.classList.remove('attention', 'ok');
                    } else if (seconds < data['limits']['medium']) {
                        iconContainer.classList.add('attention');
                        iconContainer.classList.remove('alarm', 'ok');
                    } else {
                        iconContainer.classList.add('ok');
                        iconContainer.classList.remove('alarm', 'attention');
                    }
                };

            if (!data['title-hide-on'] || data['title-hide-on'] !== location.pathname) {
                let titleElement;
                if (data['href']) {
                    titleElement = (toast.querySelector('.title > a') as HTMLAnchorElement);
                    titleElement.href = data['href'];
                } else {
                    titleElement = (toast.querySelector('.title') as HTMLAnchorElement);
                }

                if (data['message'].length > 50) {
                    data['message'] = data['message'].substr(0, 50) + '...';
                }

                titleElement.innerHTML = data['message'];
            }

            tick();
            setInterval(tick, 1000)
        }
    }
}
