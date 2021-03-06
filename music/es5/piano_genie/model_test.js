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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var test = require("tape");
var tf = require("@tensorflow/tfjs-core");
var model_1 = require("./model");
function loadJSONModelWeights(fp) {
    var rawVars = JSON.parse(fs.readFileSync(fp, 'utf8'));
    var vars = {};
    Object.keys(rawVars).forEach(function (key) {
        rawVars[key].length = rawVars[key].size;
        vars[key] = tf.tensor(Float32Array.from(rawVars[key]), rawVars[key].shape, 'float32');
    });
    return vars;
}
var TOLERANCE = 1e-6;
test('Piano Genie Model Correctness', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var modelWeightsFp, vars, genie, testSampleFuncFactory;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                modelWeightsFp = 'src/piano_genie/test_data/stp_iq_auto_dt.json';
                if (!fs.existsSync(modelWeightsFp)) {
                    console.log('Piano Genie model weights not found. Provisional pass.');
                    t.end();
                }
                vars = loadJSONModelWeights(modelWeightsFp);
                genie = new model_1.PianoGenie(undefined);
                return [4, genie.initialize(vars)];
            case 1:
                _a.sent();
                tf.tidy(function () {
                    var keys = [];
                    for (var i = 0; i < 8; ++i) {
                        genie.overrideDeltaTime(0.1);
                        keys.push(genie.next(i, 1., 1337));
                    }
                    for (var i = 7; i >= 0; --i) {
                        genie.overrideDeltaTime(0.1);
                        keys.push(genie.next(i, 0.));
                    }
                    for (var i = 0; i < 8; ++i) {
                        genie.overrideDeltaTime(0.05);
                        keys.push(genie.next(3 + (i % 2), 0.5, 1337));
                    }
                    var expectedKeys = [
                        21, 23, 24, 26, 28, 31, 35, 40,
                        43, 45, 45, 43, 42, 40, 36, 33,
                        35, 36, 36, 38, 36, 38, 36, 38
                    ];
                    t.deepEqual(keys, expectedKeys);
                });
                genie.resetState();
                tf.tidy(function () {
                    var gMajTwoOctaves = [
                        22, 24, 26, 27, 29, 31, 33,
                        34, 36, 38, 39, 41, 43, 45
                    ];
                    var keys = [];
                    for (var i = 0; i < 8; ++i) {
                        genie.overrideDeltaTime(0.1);
                        keys.push(genie.nextFromKeyWhitelist(i, gMajTwoOctaves, 1., 1337));
                    }
                    for (var i = 7; i >= 0; --i) {
                        genie.overrideDeltaTime(0.1);
                        keys.push(genie.nextFromKeyWhitelist(i, gMajTwoOctaves, 0.));
                    }
                    for (var i = 0; i < 8; ++i) {
                        genie.overrideDeltaTime(0.05);
                        keys.push(genie.nextFromKeyWhitelist(3 + (i % 2), gMajTwoOctaves, 0.5, 1337));
                    }
                    var expectedKeys = [
                        26, 26, 26, 27, 29, 31, 34, 39,
                        43, 45, 45, 43, 41, 39, 36, 33,
                        34, 36, 36, 38, 38, 39, 38, 39
                    ];
                    t.deepEqual(keys, expectedKeys);
                });
                genie.resetState();
                testSampleFuncFactory = function (pairs) {
                    return function (logits) {
                        var scores = tf.softmax(logits);
                        var _scores = scores.dataSync();
                        pairs.forEach(function (_a) {
                            var pianoKey = _a[0], expectedScore = _a[1];
                            t.ok(Math.abs(_scores[pianoKey] - expectedScore) < TOLERANCE);
                        });
                        return tf.scalar(0, 'int32');
                    };
                };
                tf.tidy(function () {
                    genie.overrideDeltaTime(0.);
                    genie.next(0);
                    genie.overrideDeltaTime(0.125);
                    genie.overrideLastOutput(43);
                    genie.next(1);
                    var sampleFunc = testSampleFuncFactory([
                        [39, 0.12285],
                        [40, 0.829168],
                        [41, 0.0366595],
                    ]);
                    genie.overrideDeltaTime(1.);
                    genie.overrideLastOutput(45);
                    genie.nextWithCustomSamplingFunction(2, sampleFunc);
                });
                genie.resetState();
                tf.tidy(function () {
                    genie.overrideDeltaTime(0.125);
                    genie.next(1);
                    genie.overrideDeltaTime(0.25);
                    genie.overrideLastOutput(44);
                    genie.next(2);
                    var sampleFunc = testSampleFuncFactory([
                        [43, 0.18577],
                        [44, 0.813153],
                        [45, 2.67857e-05],
                    ]);
                    genie.overrideDeltaTime(1.5);
                    genie.overrideLastOutput(46);
                    genie.nextWithCustomSamplingFunction(3, sampleFunc);
                });
                genie.dispose();
                t.end();
                return [2];
        }
    });
}); });
//# sourceMappingURL=model_test.js.map