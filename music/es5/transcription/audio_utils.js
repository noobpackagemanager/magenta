"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var FFT = require("fft.js");
var ndarray = require("ndarray");
var resample = require("ndarray-resample");
var logging = require("../core/logging");
var constants_1 = require("./constants");
var WEBKIT_SAMPLE_RATE = 44100;
var appeaseTsLintWindow = false;
/* var isSafari = appeaseTsLintWindow.webkitOfflineAudioContext; */
/*
var offlineCtx = isSafari ?
    new appeaseTsLintWindow.webkitOfflineAudioContext(1, WEBKIT_SAMPLE_RATE, WEBKIT_SAMPLE_RATE) :
    new appeaseTsLintWindow.OfflineAudioContext(1, constants_1.SAMPLE_RATE, constants_1.SAMPLE_RATE);
*/
function loadAudioFromUrl(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, fetch(url)
                    .then(function (body) { return body.arrayBuffer(); })
                    .then(function (buffer) { return offlineCtx.decodeAudioData(buffer); })];
        });
    });
}
exports.loadAudioFromUrl = loadAudioFromUrl;
function loadAudioFromFile(blob) {
    return __awaiter(this, void 0, void 0, function () {
        var fileReader, loadFile;
        return __generator(this, function (_a) {
            fileReader = new FileReader();
            loadFile = new Promise(function (resolve, reject) {
                fileReader.onerror = function () {
                    fileReader.abort();
                    reject(new DOMException('Something went wrong reading that file.'));
                };
                fileReader.onload = function () {
                    resolve(fileReader.result);
                };
                fileReader.readAsArrayBuffer(blob);
            });
            return [2, loadFile.then(function (arrayBuffer) { return offlineCtx.decodeAudioData(arrayBuffer); })];
        });
    });
}
exports.loadAudioFromFile = loadAudioFromFile;
function preprocessAudio(audioBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var resampledMonoAudio;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, resampleAndMakeMono(audioBuffer)];
                case 1:
                    resampledMonoAudio = _a.sent();
                    return [2, powerToDb(melSpectrogram(resampledMonoAudio, {
                            sampleRate: constants_1.SAMPLE_RATE,
                            hopLength: constants_1.SPEC_HOP_LENGTH,
                            nMels: constants_1.MEL_SPEC_BINS,
                            nFft: 2048,
                            fMin: 30,
                        }))];
            }
        });
    });
}
exports.preprocessAudio = preprocessAudio;
function melSpectrogram(y, params) {
    if (!params.power) {
        params.power = 2.0;
    }
    var stftMatrix = stft(y, params);
    var _a = magSpectrogram(stftMatrix, params.power), spec = _a[0], nFft = _a[1];
    params.nFft = nFft;
    var melBasis = createMelFilterbank(params);
    return applyWholeFilterbank(spec, melBasis);
}
function powerToDb(spec, amin, topDb) {
    if (amin === void 0) { amin = 1e-10; }
    if (topDb === void 0) { topDb = 80.0; }
    var width = spec.length;
    var height = spec[0].length;
    var logSpec = [];
    for (var i = 0; i < width; i++) {
        logSpec[i] = new Float32Array(height);
    }
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            var val = spec[i][j];
            logSpec[i][j] = 10.0 * Math.log10(Math.max(amin, val));
        }
    }
    if (topDb) {
        if (topDb < 0) {
            throw new Error("topDb must be non-negative.");
        }
        for (var i = 0; i < width; i++) {
            var maxVal = max(logSpec[i]);
            for (var j = 0; j < height; j++) {
                logSpec[i][j] = Math.max(logSpec[i][j], maxVal - topDb);
            }
        }
    }
    return logSpec;
}
function getMonoAudio(audioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
        return audioBuffer.getChannelData(0);
    }
    if (audioBuffer.numberOfChannels !== 2) {
        throw Error(audioBuffer.numberOfChannels + " channel audio is not supported.");
    }
    var ch0 = audioBuffer.getChannelData(0);
    var ch1 = audioBuffer.getChannelData(1);
    var mono = new Float32Array(audioBuffer.length);
    for (var i = 0; i < audioBuffer.length; ++i) {
        mono[i] = (ch0[i] + ch1[i]) / 2;
    }
    return mono;
}
function resampleAndMakeMono(audioBuffer, targetSr) {
    if (targetSr === void 0) { targetSr = constants_1.SAMPLE_RATE; }
    return __awaiter(this, void 0, void 0, function () {
        var sourceSr, lengthRes, bufferSource, originalAudio, resampledAudio;
        return __generator(this, function (_a) {
            if (audioBuffer.sampleRate === targetSr) {
                return [2, getMonoAudio(audioBuffer)];
            }
            sourceSr = audioBuffer.sampleRate;
            lengthRes = audioBuffer.length * targetSr / sourceSr;
            if (!isSafari) {
                bufferSource = offlineCtx.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(offlineCtx.destination);
                bufferSource.start();
                return [2, offlineCtx.startRendering().then(function (buffer) { return buffer.getChannelData(0); })];
            }
            else {
                logging.log('Safari does not support WebAudio resampling, so this may be slow.', 'O&F', 5);
                originalAudio = getMonoAudio(audioBuffer);
                resampledAudio = new Float32Array(lengthRes);
                resample(ndarray(resampledAudio, [lengthRes]), ndarray(originalAudio, [originalAudio.length]));
                return [2, resampledAudio];
            }
            return [2];
        });
    });
}
function magSpectrogram(stft, power) {
    var spec = stft.map(function (fft) { return pow(mag(fft), power); });
    var nFft = stft[0].length - 1;
    return [spec, nFft];
}
function stft(y, params) {
    var nFft = params.nFft || 2048;
    var winLength = params.winLength || nFft;
    var hopLength = params.hopLength || Math.floor(winLength / 4);
    var fftWindow = hannWindow(winLength);
    fftWindow = padCenterToLength(fftWindow, nFft);
    y = padReflect(y, Math.floor(nFft / 2));
    var yFrames = frame(y, nFft, hopLength);
    var stftMatrix = [];
    var width = yFrames.length;
    var height = nFft + 2;
    for (var i = 0; i < width; i++) {
        var col = new Float32Array(height);
        stftMatrix[i] = col;
    }
    for (var i = 0; i < width; i++) {
        var winBuffer = applyWindow(yFrames[i], fftWindow);
        var col = fft(winBuffer);
        stftMatrix[i].set(col.slice(0, height));
    }
    return stftMatrix;
}
function applyWholeFilterbank(spec, filterbank) {
    var out = [];
    for (var i = 0; i < spec.length; i++) {
        out[i] = applyFilterbank(spec[i], filterbank);
    }
    return out;
}
function applyFilterbank(mags, filterbank) {
    if (mags.length !== filterbank[0].length) {
        throw new Error("Each entry in filterbank should have dimensions " +
            ("matching FFT. |mags| = " + mags.length + ", ") +
            ("|filterbank[0]| = " + filterbank[0].length + "."));
    }
    var out = new Float32Array(filterbank.length);
    for (var i = 0; i < filterbank.length; i++) {
        var win = applyWindow(mags, filterbank[i]);
        out[i] = win.reduce(function (a, b) { return a + b; });
    }
    return out;
}
function applyWindow(buffer, win) {
    if (buffer.length !== win.length) {
        console.error("Buffer length " + buffer.length + " != window length " + win.length + ".");
        return null;
    }
    var out = new Float32Array(buffer.length);
    for (var i = 0; i < buffer.length; i++) {
        out[i] = win[i] * buffer[i];
    }
    return out;
}
function padCenterToLength(data, length) {
    if (data.length > length) {
        throw new Error('Data is longer than length.');
    }
    var paddingLeft = Math.floor((length - data.length) / 2);
    var paddingRight = length - data.length - paddingLeft;
    return padConstant(data, [paddingLeft, paddingRight]);
}
function padConstant(data, padding) {
    var padLeft, padRight;
    if (typeof (padding) === 'object') {
        padLeft = padding[0], padRight = padding[1];
    }
    else {
        padLeft = padRight = padding;
    }
    var out = new Float32Array(data.length + padLeft + padRight);
    out.set(data, padLeft);
    return out;
}
function padReflect(data, padding) {
    var out = padConstant(data, padding);
    for (var i = 0; i < padding; i++) {
        out[i] = out[2 * padding - i];
        out[out.length - i - 1] = out[out.length - 2 * padding + i - 1];
    }
    return out;
}
function frame(data, frameLength, hopLength) {
    var bufferCount = Math.floor((data.length - frameLength) / hopLength) + 1;
    var buffers = Array.from({ length: bufferCount }, function (x, i) { return new Float32Array(frameLength); });
    for (var i = 0; i < bufferCount; i++) {
        var ind = i * hopLength;
        var buffer = data.slice(ind, ind + frameLength);
        buffers[i].set(buffer);
        if (buffer.length !== frameLength) {
            continue;
        }
    }
    return buffers;
}
function createMelFilterbank(params) {
    var fMin = params.fMin || 0;
    var fMax = params.fMax || params.sampleRate / 2;
    var nMels = params.nMels || 128;
    var nFft = params.nFft || 2048;
    var fftFreqs = calculateFftFreqs(params.sampleRate, nFft);
    var melFreqs = calculateMelFreqs(nMels + 2, fMin, fMax);
    var melDiff = internalDiff(melFreqs);
    var ramps = outerSubtract(melFreqs, fftFreqs);
    var filterSize = ramps[0].length;
    var weights = [];
    for (var i = 0; i < nMels; i++) {
        weights[i] = new Float32Array(filterSize);
        for (var j = 0; j < ramps[i].length; j++) {
            var lower = -ramps[i][j] / melDiff[i];
            var upper = ramps[i + 2][j] / melDiff[i + 1];
            var weight = Math.max(0, Math.min(lower, upper));
            weights[i][j] = weight;
        }
    }
    var _loop_1 = function (i) {
        var enorm = 2.0 / (melFreqs[2 + i] - melFreqs[i]);
        weights[i] = weights[i].map(function (val) { return val * enorm; });
    };
    for (var i = 0; i < weights.length; i++) {
        _loop_1(i);
    }
    return weights;
}
function fft(y) {
    var fft = new FFT(y.length);
    var out = fft.createComplexArray();
    var data = fft.toComplexArray(y);
    fft.transform(out, data);
    return out;
}
function hannWindow(length) {
    var win = new Float32Array(length);
    for (var i = 0; i < length; i++) {
        win[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
    }
    return win;
}
function linearSpace(start, end, count) {
    var delta = (end - start) / (count - 1);
    var out = new Float32Array(count);
    for (var i = 0; i < count; i++) {
        out[i] = start + delta * i;
    }
    return out;
}
function mag(y) {
    var out = new Float32Array(y.length / 2);
    for (var i = 0; i < y.length / 2; i++) {
        out[i] = Math.sqrt(y[i * 2] * y[i * 2] + y[i * 2 + 1] * y[i * 2 + 1]);
    }
    return out;
}
function hzToMel(hz) {
    return 1125.0 * Math.log(1 + hz / 700.0);
}
function melToHz(mel) {
    return 700.0 * (Math.exp(mel / 1125.0) - 1);
}
function calculateFftFreqs(sampleRate, nFft) {
    return linearSpace(0, sampleRate / 2, Math.floor(1 + nFft / 2));
}
function calculateMelFreqs(nMels, fMin, fMax) {
    var melMin = hzToMel(fMin);
    var melMax = hzToMel(fMax);
    var mels = linearSpace(melMin, melMax, nMels);
    var hzs = mels.map(function (mel) { return melToHz(mel); });
    return hzs;
}
function internalDiff(arr) {
    var out = new Float32Array(arr.length - 1);
    for (var i = 0; i < arr.length; i++) {
        out[i] = arr[i + 1] - arr[i];
    }
    return out;
}
function outerSubtract(arr, arr2) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        out[i] = new Float32Array(arr2.length);
    }
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr2.length; j++) {
            out[i][j] = arr[i] - arr2[j];
        }
    }
    return out;
}
function pow(arr, power) {
    return arr.map(function (v) { return Math.pow(v, power); });
}
function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); });
}
//# sourceMappingURL=audio_utils.js.map