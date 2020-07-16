'use strict';
import { Utils } from "../../../good-funcs.js/src/ts/GoodFuncs.js";
import { BrowserDotenv } from "../../../browser-dotenv.js/dist/browser-dotenv.js";
const AUTH_ENDPOINT = '/notify/auth', ENCRYPTION_KEY = 'JFd0654', MESSAGE_DEFAULT_DISPLAY_LENGTH = 3000, TIMER_DEFAULT_DISPLAY_LENGTH = 1800000;
let defaultToastSettings = {
    html: '',
    displayLength: MESSAGE_DEFAULT_DISPLAY_LENGTH,
    classes: 'notify'
};
export var Notify;
(function (Notify_1) {
    class Notify {
        /**
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        constructor(userId, _errorCallback = null, isDebug = false) {
            this._errorCallback = _errorCallback;
            /**
             * @type {string[]}
             *
             * @private
             */
            this._channels = [];
            this._ready = Promise.all(Utils.GoodFuncs.getScripts(['https://js.pusher.com/4.4/pusher.min.js'])).then(function () {
                Pusher.logToConsole = isDebug;
                this._pusher = new Pusher(window[BrowserDotenv.ENV_WINDOW_PROPERTY]['PUSHER_TOKEN'], {
                    cluster: 'eu',
                    forceTLS: true,
                    authEndpoint: AUTH_ENDPOINT,
                    encryptionMasterKey: ENCRYPTION_KEY,
                    auth: {
                        params: { user_id: userId },
                    }
                });
            }.bind(this));
        }
        /**
         * @param {string} channelName
         *
         * @returns {Object}
         */
        getChannel(channelName) {
            if (!this._channels[channelName]) {
                this._channels[channelName] = this._pusher.subscribe(channelName);
                this._channels[channelName].bind('pusher:subscription_error', function (status) {
                    if (status >= 400) {
                        this._errorCallback && this._errorCallback(status);
                    }
                }.bind(this));
            }
            return this._channels[channelName];
        }
        /**
         * @param {string} channelName
         * @param eventName
         */
        subscribe(channelName, eventName) {
            let channel = this.getChannel(channelName);
            channel.bind(eventName, function (data) {
                this.handler(data);
            }.bind(this));
        }
        /**
         * @param {string} channelName
         * @param eventName
         */
        unsubscribe(channelName, eventName) {
            if (!this._channels[channelName]) {
                return;
            }
            this._channels[channelName].unbind(eventName);
        }
        /**
         * @returns {Promise}
         */
        whenReady() {
            return this._ready;
        }
    }
    class Message extends Notify {
        /**
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        constructor(userId, _errorCallback = null, isDebug = false) {
            super(userId, _errorCallback, isDebug);
            this._errorCallback = _errorCallback;
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
        handler(data) {
            if (!data['message']) {
                throw Error('Полученные данные не содержат текстового сообщения.');
            }
            let html = (new DOMParser).parseFromString(this._markup, 'text/html'), textElement = html && html.querySelector('.text'), iconContainer = html && html.querySelector('.icon-container'), toastSettings = {};
            Object.assign(toastSettings, defaultToastSettings);
            textElement.innerHTML = data['message'];
            iconContainer.classList.add(data['status']);
            toastSettings['html'] = html.body.innerHTML;
            let toast;
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden && !toast) {
                    toast = M.toast(toastSettings);
                }
            });
            if (document.hidden) {
                return;
            }
            toast = M.toast(toastSettings);
        }
    }
    Notify_1.Message = Message;
    class Timer extends Notify {
        /**
         * @param userId
         * @param {((status: Number) => void) | null} _errorCallback
         * @param {boolean} isDebug
         */
        constructor(userId, _errorCallback = null, isDebug = false) {
            super(userId, _errorCallback, isDebug);
            this._errorCallback = _errorCallback;
            let self = this;
            this._ready = this._ready.then(function () {
                fetch('/vendor/avtomon/notify.js/dist/html/timer.html').then(async function (response) {
                    self._markup = await response.text();
                    Utils.GoodFuncs.addCss(['/vendor/avtomon/notify.js/dist/css/timer.css']);
                });
            }).then();
        }
        /**
         * @param {string} message
         * @returns {boolean}
         */
        static timerIsPresent(message) {
            return Array.from(document.getElementsByClassName('toast')).some(function (element) {
                return M.Toast.getInstance(element).el.querySelector('a').innerHTML === message;
            });
        }
        /**
         * @param {Object} data
         */
        handler(data) {
            if (!data['start_time'] || !data['message']) {
                throw Error('Полученные данные не содержат время старта таймера.');
            }
            if (Timer.timerIsPresent(data['message'])) {
                return;
            }
            if (location.pathname.includes(data['title_hide_on'])) {
                return;
            }
            let html = (new DOMParser).parseFromString(this._markup, 'text/html'), uniq = 'timer-' + Utils.GoodFuncs.getRandomString(12), toastSettings = {}, textElement = html && html.querySelector('a');
            textElement.innerHTML = data['message'];
            textElement.href = data['href'];
            Object.assign(toastSettings, defaultToastSettings);
            toastSettings['classes'] = `${toastSettings['classes']} ${uniq}`;
            toastSettings['html'] = html.body.innerHTML;
            toastSettings['displayLength'] = TIMER_DEFAULT_DISPLAY_LENGTH;
            let toastInstance = M.toast(toastSettings), toast = document.querySelector('.' + uniq), timerElement = toast.querySelector('.timer'), iconContainer = toast.querySelector('.icon-container'), seconds = data['start_time'], tick = function () {
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
                }
                else if (seconds < data['limits']['medium']) {
                    iconContainer.classList.add('attention');
                    iconContainer.classList.remove('alarm', 'ok');
                }
                else {
                    iconContainer.classList.add('ok');
                    iconContainer.classList.remove('alarm', 'attention');
                }
            };
            tick();
            setInterval(tick, 1000);
        }
    }
    Notify_1.Timer = Timer;
})(Notify || (Notify = {}));
