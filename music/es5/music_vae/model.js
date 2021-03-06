"use strict";
//const performance = require('perf_hooks').performance;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var tf = require("@tensorflow/tfjs-core");
var chords = require("../core/chords");
var constants = require("../core/constants");
var data = require("../core/data");
var logging = require("../core/logging");
var LayerVars = (function () {
    function LayerVars(kernel, bias) {
        if (kernel === undefined) {
            throw Error('`kernel` is undefined.');
        }
        if (bias === undefined) {
            throw Error('`bias` is undefined.');
        }
        this.kernel = kernel;
        this.bias = bias;
    }
    return LayerVars;
}());
exports.LayerVars = LayerVars;
function dense(vars, inputs) {
    return inputs.matMul(vars.kernel).add(vars.bias);
}
var Encoder = (function () {
    function Encoder() {
    }
    return Encoder;
}());
exports.Encoder = Encoder;
var BidirectonalLstmEncoder = (function (_super) {
    __extends(BidirectonalLstmEncoder, _super);
    function BidirectonalLstmEncoder(lstmFwVars, lstmBwVars, muVars) {
        var _this = _super.call(this) || this;
        _this.lstmFwVars = lstmFwVars;
        _this.lstmBwVars = lstmBwVars;
        _this.muVars = muVars;
        _this.zDims = muVars ? _this.muVars.bias.shape[0] : null;
        return _this;
    }
    BidirectonalLstmEncoder.prototype.encode = function (sequence, segmentLengths) {
        var _this = this;
        if (segmentLengths) {
            throw new Error('Variable-length segments not supported in flat encoder');
        }
        return tf.tidy(function () {
            var fwState = _this.singleDirection(sequence, true);
            var bwState = _this.singleDirection(sequence, false);
            var finalState = tf.concat([fwState[1], bwState[1]], 1);
            if (_this.muVars) {
                return dense(_this.muVars, finalState);
            }
            else {
                return finalState;
            }
        });
    };
    BidirectonalLstmEncoder.prototype.singleDirection = function (inputs, fw) {
        var batchSize = inputs.shape[0];
        var length = inputs.shape[1];
        var lstmVars = fw ? this.lstmFwVars : this.lstmBwVars;
        var state = [
            tf.zeros([batchSize, lstmVars.bias.shape[0] / 4]),
            tf.zeros([batchSize, lstmVars.bias.shape[0] / 4])
        ];
        var forgetBias = tf.scalar(1.0);
        var lstm = function (data, state) {
            return tf.basicLSTMCell(forgetBias, lstmVars.kernel, lstmVars.bias, data, state[0], state[1]);
        };
        var splitInputs = tf.split(inputs.toFloat(), length, 1);
        for (var _i = 0, _a = (fw ? splitInputs : splitInputs.reverse()); _i < _a.length; _i++) {
            var data_1 = _a[_i];
            state = lstm(data_1.squeeze([1]), state);
        }
        return state;
    };
    return BidirectonalLstmEncoder;
}(Encoder));
var HierarchicalEncoder = (function (_super) {
    __extends(HierarchicalEncoder, _super);
    function HierarchicalEncoder(baseEncoders, numSteps, muVars) {
        var _this = _super.call(this) || this;
        _this.baseEncoders = baseEncoders;
        _this.numSteps = numSteps;
        _this.muVars = muVars;
        _this.zDims = _this.muVars.bias.shape[0];
        return _this;
    }
    HierarchicalEncoder.prototype.encode = function (sequence, segmentLengths) {
        var _this = this;
        if (segmentLengths) {
            if (sequence.shape[0] !== 1) {
                throw new Error('When using variable-length segments, batch size must be 1.');
            }
            if (segmentLengths.length !== this.numSteps[0]) {
                throw new Error('Must provide length for all variable-length segments.');
            }
        }
        return tf.tidy(function () {
            var inputs = sequence;
            for (var level = 0; level < _this.baseEncoders.length; ++level) {
                var levelSteps = _this.numSteps[level];
                var splitInputs = tf.split(inputs, levelSteps, 1);
                var embeddings = [];
                for (var step = 0; step < levelSteps; ++step) {
                    embeddings.push(_this.baseEncoders[level].encode((level === 0 && segmentLengths) ?
                        tf.slice3d(splitInputs[step], [0, 0, 0], [1, segmentLengths[step], -1]) :
                        splitInputs[step]));
                }
                inputs = tf.stack(embeddings, 1);
            }
            return dense(_this.muVars, inputs.squeeze([1]));
        });
    };
    return HierarchicalEncoder;
}(Encoder));
function initLstmCells(z, lstmCellVars, zToInitStateVars) {
    var lstmCells = [];
    var c = [];
    var h = [];
    var initialStates = tf.split(dense(zToInitStateVars, z).tanh(), 2 * lstmCellVars.length, 1);
    var _loop_1 = function (i) {
        var lv = lstmCellVars[i];
        var forgetBias = tf.scalar(1.0);
        lstmCells.push(function (data, c, h) {
            return tf.basicLSTMCell(forgetBias, lv.kernel, lv.bias, data, c, h);
        });
        c.push(initialStates[i * 2]);
        h.push(initialStates[i * 2 + 1]);
    };
    for (var i = 0; i < lstmCellVars.length; ++i) {
        _loop_1(i);
    }
    return { 'cell': lstmCells, 'c': c, 'h': h };
}
var Decoder = (function () {
    function Decoder() {
    }
    return Decoder;
}());
exports.Decoder = Decoder;
var BaseDecoder = (function (_super) {
    __extends(BaseDecoder, _super);
    function BaseDecoder(lstmCellVars, zToInitStateVars, outputProjectVars, outputDims) {
        var _this = _super.call(this) || this;
        _this.lstmCellVars = lstmCellVars;
        _this.zToInitStateVars = zToInitStateVars;
        _this.outputProjectVars = outputProjectVars;
        _this.zDims = _this.zToInitStateVars.kernel.shape[0];
        _this.outputDims = outputDims || outputProjectVars.bias.shape[0];
        return _this;
    }
    BaseDecoder.prototype.decode = function (z, length, initialInput, temperature, controls) {
        var _this = this;
        var batchSize = z.shape[0];
        return tf.tidy(function () {
            var _a;
            var lstmCell = initLstmCells(z, _this.lstmCellVars, _this.zToInitStateVars);
            var samples = [];
            var nextInput = initialInput ?
                initialInput :
                tf.zeros([batchSize, _this.outputDims]);
            var splitControls = controls ?
                tf.split(tf.tile(controls, [batchSize, 1]), controls.shape[0]) :
                undefined;
            for (var i = 0; i < length; ++i) {
                var toConcat = splitControls ? [nextInput, z, splitControls[i]] : [nextInput, z];
                _a = tf.multiRNNCell(lstmCell.cell, tf.concat(toConcat, 1), lstmCell.c, lstmCell.h), lstmCell.c = _a[0], lstmCell.h = _a[1];
                var lstmOutput = dense(_this.outputProjectVars, lstmCell.h[lstmCell.h.length - 1]);
                nextInput = _this.sample(lstmOutput, temperature);
                samples.push(nextInput);
            }
            return tf.stack(samples, 1);
        });
    };
    return BaseDecoder;
}(Decoder));
var CategoricalDecoder = (function (_super) {
    __extends(CategoricalDecoder, _super);
    function CategoricalDecoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CategoricalDecoder.prototype.sample = function (lstmOutput, temperature) {
        var logits = lstmOutput;
        var timeLabels = (temperature ?
            tf.multinomial(logits.div(tf.scalar(temperature)), 1)
                .as1D() :
            logits.argMax(1).as1D());
        return tf.oneHot(timeLabels, this.outputDims).toFloat();
    };
    return CategoricalDecoder;
}(BaseDecoder));
var NadeDecoder = (function (_super) {
    __extends(NadeDecoder, _super);
    function NadeDecoder(lstmCellVars, zToInitStateVars, outputProjectVars, nade) {
        var _this = _super.call(this, lstmCellVars, zToInitStateVars, outputProjectVars, nade.numDims) || this;
        _this.nade = nade;
        return _this;
    }
    NadeDecoder.prototype.sample = function (lstmOutput, temperature) {
        var _a = tf.split(lstmOutput, [this.nade.numHidden, this.nade.numDims], 1), encBias = _a[0], decBias = _a[1];
        return this.nade.sample(encBias, decBias);
    };
    return NadeDecoder;
}(BaseDecoder));
var GrooveDecoder = (function (_super) {
    __extends(GrooveDecoder, _super);
    function GrooveDecoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GrooveDecoder.prototype.sample = function (lstmOutput, temperature) {
        var _a = tf.split(lstmOutput, 3, 1), hits = _a[0], velocities = _a[1], offsets = _a[2];
        velocities = tf.sigmoid(velocities);
        offsets = tf.tanh(offsets);
        if (temperature) {
            hits = tf.sigmoid(hits.div(tf.scalar(temperature)));
            var threshold = tf.randomUniform(hits.shape, 0, 1);
            hits = tf.greater(hits, threshold).toFloat();
        }
        else {
            hits = tf.greater(tf.sigmoid(hits), 0.5).toFloat();
        }
        return tf.concat([hits, velocities, offsets], 1);
    };
    return GrooveDecoder;
}(BaseDecoder));
var ConductorDecoder = (function (_super) {
    __extends(ConductorDecoder, _super);
    function ConductorDecoder(coreDecoders, lstmCellVars, zToInitStateVars, numSteps) {
        var _this = _super.call(this) || this;
        _this.coreDecoders = coreDecoders;
        _this.lstmCellVars = lstmCellVars;
        _this.zToInitStateVars = zToInitStateVars;
        _this.numSteps = numSteps;
        _this.zDims = _this.zToInitStateVars.kernel.shape[0];
        _this.outputDims =
            _this.coreDecoders.reduce(function (dims, dec) { return dims + dec.outputDims; }, 0);
        return _this;
    }
    ConductorDecoder.prototype.decode = function (z, length, initialInput, temperature, controls) {
        var _this = this;
        var batchSize = z.shape[0];
        return tf.tidy(function () {
            var _a;
            var lstmCell = initLstmCells(z, _this.lstmCellVars, _this.zToInitStateVars);
            var samples = [];
            var initialInput = _this.coreDecoders.map(function (_) { return undefined; });
            var dummyInput = tf.zeros([batchSize, 1]);
            var splitControls = controls ? tf.split(controls, _this.numSteps) : undefined;
            for (var i = 0; i < _this.numSteps; ++i) {
                _a = tf.multiRNNCell(lstmCell.cell, dummyInput, lstmCell.c, lstmCell.h), lstmCell.c = _a[0], lstmCell.h = _a[1];
                var currSamples = [];
                for (var j = 0; j < _this.coreDecoders.length; ++j) {
                    currSamples.push(_this.coreDecoders[j].decode(lstmCell.h[lstmCell.h.length - 1], length / _this.numSteps, initialInput[j], temperature, splitControls ? splitControls[i] : undefined));
                }
                samples.push(tf.concat(currSamples, -1));
                initialInput = currSamples.map(function (s) { return s.slice([0, -1, 0], [batchSize, 1, s.shape[s.rank - 1]])
                    .squeeze([1])
                    .toFloat(); });
            }
            return tf.concat(samples, 1);
        });
    };
    return ConductorDecoder;
}(Decoder));
var Nade = (function () {
    function Nade(encWeights, decWeightsT) {
        this.numDims = encWeights.shape[0];
        this.numHidden = encWeights.shape[2];
        this.encWeights = encWeights.as2D(this.numDims, this.numHidden);
        this.decWeightsT = decWeightsT.as2D(this.numDims, this.numHidden);
    }
    Nade.prototype.sample = function (encBias, decBias) {
        var _this = this;
        var batchSize = encBias.shape[0];
        return tf.tidy(function () {
            var samples = [];
            var a = encBias.clone();
            for (var i = 0; i < _this.numDims; i++) {
                var h = tf.sigmoid(a);
                var encWeightsI = _this.encWeights.slice([i, 0], [1, _this.numHidden]).as1D();
                var decWeightsTI = _this.decWeightsT.slice([i, 0], [1, _this.numHidden]);
                var decBiasI = decBias.slice([0, i], [batchSize, 1]);
                var contfogitsI = decBiasI.add(tf.matMul(h, decWeightsTI, false, true));
                var condProbsI = contfogitsI.sigmoid();
                var samplesI = condProbsI.greaterEqual(tf.scalar(0.5)).toFloat().as1D();
                if (i < _this.numDims - 1) {
                    a = a.add(tf.outerProduct(samplesI.toFloat(), encWeightsI));
                }
                samples.push(samplesI);
            }
            return tf.stack(samples, 1);
        });
    };
    return Nade;
}());
exports.Nade = Nade;
var MusicVAE = (function () {
    function MusicVAE(checkpointURL, spec) {
        this.initialized = false;
        this.checkpointURL = checkpointURL;
        this.spec = spec;
    }
    MusicVAE.prototype.instantiateFromSpec = function () {
        this.dataConverter = data.converterFromSpec(this.spec.dataConverter);
        this.chordEncoder = this.spec.chordEncoder ?
            chords.chordEncoderFromType(this.spec.chordEncoder) :
            undefined;
    };
    MusicVAE.prototype.dispose = function () {
        var _this = this;
        if (this.rawVars !== undefined) {
            Object.keys(this.rawVars).forEach(function (name) { return _this.rawVars[name].dispose(); });
        }
        this.encoder = undefined;
        this.decoder = undefined;
        this.initialized = false;
    };
    MusicVAE.prototype.getLstmLayers = function (cellFormat, vars) {
        var lstmLayers = [];
        var l = 0;
        while (true) {
            var cellPrefix = cellFormat.replace('%d', l.toString());
            if (!(cellPrefix + 'kernel' in vars)) {
                break;
            }
            lstmLayers.push(new LayerVars(vars[cellPrefix + 'kernel'], vars[cellPrefix + 'bias']));
            ++l;
        }
        return lstmLayers;
    };
    MusicVAE.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, LSTM_CELL_FORMAT, MUTLI_LSTM_CELL_FORMAT, CONDUCTOR_PREFIX, BIDI_LSTM_CELL, ENCODER_FORMAT, HIER_ENCODER_FORMAT, vars, encMu, fwLayers_1, bwLayers_1, baseEncoders, fwLayers, bwLayers, decVarPrefix, decVarPrefixes, i, baseDecoders, condLstmLayers, condZtoInitState;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.dispose();
                        startTime = performance.now();
                        if (!!this.spec) return [3, 2];
                        return [4, fetch(this.checkpointURL + "/config.json")
                                .then(function (response) { return response.json(); })
                                .then(function (spec) {
                                if (spec.type !== 'MusicVAE') {
                                    throw new Error("Attempted to instantiate MusicVAE model with incorrect type:\n                  " + spec.type);
                                }
                                _this.spec = spec;
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.instantiateFromSpec();
                        LSTM_CELL_FORMAT = 'cell_%d/lstm_cell/';
                        MUTLI_LSTM_CELL_FORMAT = "multi_rnn_cell/" + LSTM_CELL_FORMAT;
                        CONDUCTOR_PREFIX = 'decoder/hierarchical_level_0/';
                        BIDI_LSTM_CELL = 'cell_%d/bidirectional_rnn/%s/multi_rnn_cell/cell_0/lstm_cell/';
                        ENCODER_FORMAT = "encoder/" + BIDI_LSTM_CELL;
                        HIER_ENCODER_FORMAT = "encoder/hierarchical_level_%d/" + BIDI_LSTM_CELL.replace('%d', '0');
                        return [4, fetch(this.checkpointURL + "/weights_manifest.json")
                                .then(function (response) { return response.json(); })
                                .then(function (manifest) {
                                return tf.io.loadWeights(manifest, _this.checkpointURL);
                            })];
                    case 3:
                        vars = _a.sent();
                        this.rawVars = vars;
                        encMu = new LayerVars(vars['encoder/mu/kernel'], vars['encoder/mu/bias']);
                        if (this.dataConverter.numSegments) {
                            fwLayers_1 = this.getLstmLayers(HIER_ENCODER_FORMAT.replace('%s', 'fw'), vars);
                            bwLayers_1 = this.getLstmLayers(HIER_ENCODER_FORMAT.replace('%s', 'bw'), vars);
                            if (fwLayers_1.length !== bwLayers_1.length || fwLayers_1.length !== 2) {
                                throw Error('Only 2 hierarchical encoder levels are supported. ' +
                                    ("Got " + fwLayers_1.length + " forward and " + bwLayers_1.length + " ") +
                                    'backward.');
                            }
                            baseEncoders = [0, 1].map(function (l) { return new BidirectonalLstmEncoder(fwLayers_1[l], bwLayers_1[l]); });
                            this.encoder = new HierarchicalEncoder(baseEncoders, [this.dataConverter.numSegments, 1], encMu);
                        }
                        else {
                            fwLayers = this.getLstmLayers(ENCODER_FORMAT.replace('%s', 'fw'), vars);
                            bwLayers = this.getLstmLayers(ENCODER_FORMAT.replace('%s', 'bw'), vars);
                            if (fwLayers.length !== bwLayers.length || fwLayers.length !== 1) {
                                throw Error('Only single-layer bidirectional encoders are supported. ' +
                                    ("Got " + fwLayers.length + " forward and " + bwLayers.length + " ") +
                                    'backward.');
                            }
                            this.encoder =
                                new BidirectonalLstmEncoder(fwLayers[0], bwLayers[0], encMu);
                        }
                        decVarPrefix = (this.dataConverter.numSegments) ? 'core_decoder/' : '';
                        decVarPrefixes = [];
                        if (this.dataConverter.NUM_SPLITS) {
                            for (i = 0; i < this.dataConverter.NUM_SPLITS; ++i) {
                                decVarPrefixes.push(decVarPrefix + "core_decoder_" + i + "/decoder/");
                            }
                        }
                        else {
                            decVarPrefixes.push(decVarPrefix + "decoder/");
                        }
                        baseDecoders = decVarPrefixes.map(function (varPrefix) {
                            var decLstmLayers = _this.getLstmLayers(varPrefix + MUTLI_LSTM_CELL_FORMAT, vars);
                            var decZtoInitState = new LayerVars(vars[varPrefix + "z_to_initial_state/kernel"], vars[varPrefix + "z_to_initial_state/bias"]);
                            var decOutputProjection = new LayerVars(vars[varPrefix + "output_projection/kernel"], vars[varPrefix + "output_projection/bias"]);
                            if (varPrefix + "nade/w_enc" in vars) {
                                return new NadeDecoder(decLstmLayers, decZtoInitState, decOutputProjection, new Nade(vars[varPrefix + "nade/w_enc"], vars[varPrefix + "nade/w_dec_t"]));
                            }
                            else if (_this.spec.dataConverter.type === 'GrooveConverter') {
                                return new GrooveDecoder(decLstmLayers, decZtoInitState, decOutputProjection);
                            }
                            else {
                                return new CategoricalDecoder(decLstmLayers, decZtoInitState, decOutputProjection);
                            }
                        });
                        if (this.dataConverter.numSegments) {
                            condLstmLayers = this.getLstmLayers(CONDUCTOR_PREFIX + LSTM_CELL_FORMAT, vars);
                            condZtoInitState = new LayerVars(vars[CONDUCTOR_PREFIX + "initial_state/kernel"], vars[CONDUCTOR_PREFIX + "initial_state/bias"]);
                            this.decoder = new ConductorDecoder(baseDecoders, condLstmLayers, condZtoInitState, this.dataConverter.numSegments);
                        }
                        else if (baseDecoders.length === 1) {
                            this.decoder = baseDecoders[0];
                        }
                        else {
                            throw Error('Unexpected number of base decoders without conductor: ' +
                                ("" + baseDecoders.length));
                        }
                        this.initialized = true;
                        logging.logWithDuration('Initialized model', startTime, 'MusicVAE');
                        return [2];
                }
            });
        });
    };
    MusicVAE.prototype.isInitialized = function () {
        return this.initialized;
    };
    MusicVAE.prototype.interpolate = function (inputSequences, numInterps, temperature, chordProgression) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, inputZs, interpZs, outputSequenes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.chordEncoder && !chordProgression) {
                            throw new Error('Chord progression expected but not provided.');
                        }
                        if (!this.chordEncoder && chordProgression) {
                            throw new Error('Unexpected chord progression provided.');
                        }
                        if (!!this.initialized) return [3, 2];
                        return [4, this.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        startTime = 0;
                        return [4, this.encode(inputSequences, chordProgression)];
                    case 3:
                        inputZs = _a.sent();
                        interpZs = tf.tidy(function () { return _this.getInterpolatedZs(inputZs, numInterps); });
                        inputZs.dispose();
                        outputSequenes = this.decode(interpZs, temperature, chordProgression);
                        interpZs.dispose();
                        outputSequenes.then(function () { return logging.logWithDuration('Interpolation completed', startTime, 'MusicVAE', 20); });
                        return [2, outputSequenes];
                }
            });
        });
    };
    MusicVAE.prototype.getSegmentLengths = function (inputTensors) {
        return __awaiter(this, void 0, void 0, function () {
            var numSteps, numSegments, isEndTensor, isEndArray, maxSegmentLength, segmentLengths, offset, fromIndex;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (inputTensors.shape[0] > 1) {
                            throw new Error('Variable-length segments not supported for batch size > 1.');
                        }
                        numSteps = this.dataConverter.numSteps;
                        numSegments = this.dataConverter.numSegments;
                        isEndTensor = tf.tidy(function () { return tf.min(tf.equal(inputTensors.squeeze([0]), _this.dataConverter.endTensor.expandDims(0)), 1); });
                        return [4, isEndTensor.data()];
                    case 1:
                        isEndArray = _a.sent();
                        isEndTensor.dispose();
                        maxSegmentLength = numSteps / numSegments;
                        segmentLengths = [];
                        offset = 0;
                        fromIndex = isEndArray.indexOf(1);
                        while (fromIndex !== -1) {
                            segmentLengths.push(fromIndex - offset + 1);
                            offset += maxSegmentLength;
                            fromIndex = isEndArray.indexOf(1, offset);
                        }
                        if (segmentLengths.length !== numSegments) {
                            throw new Error("Incorrect number of segments: " + segmentLengths.length + " != " + numSegments);
                        }
                        return [2, segmentLengths];
                }
            });
        });
    };
    MusicVAE.prototype.encodeChordProgression = function (chordProgression) {
        var numSteps = this.dataConverter.numSteps;
        var numSegments = this.dataConverter.numSegments;
        var numChordSteps = this.dataConverter.SEGMENTED_BY_TRACK ?
            numSteps / numSegments :
            numSteps;
        var encodedChordProgression = this.dataConverter.SEGMENTED_BY_TRACK ?
            tf.concat2d([
                this.chordEncoder.encode(constants.NO_CHORD).expandDims(0),
                this.chordEncoder.encodeProgression(chordProgression, numChordSteps - 1)
            ], 0) :
            this.chordEncoder.encodeProgression(chordProgression, numChordSteps);
        return this.dataConverter.SEGMENTED_BY_TRACK ?
            tf.tile(encodedChordProgression, [numSegments, 1]) :
            encodedChordProgression;
    };
    MusicVAE.prototype.encode = function (inputSequences, chordProgression) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, inputTensors, segmentLengths, _a, newInputTensors, z;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.chordEncoder && !chordProgression) {
                            throw new Error('Chord progression expected but not provided.');
                        }
                        if (!this.chordEncoder && chordProgression) {
                            throw new Error('Unexpected chord progression provided.');
                        }
                        if (this.chordEncoder && this.dataConverter.endTensor &&
                            chordProgression.length > 1) {
                            throw new Error('Multiple chords not supported when using variable-length segments.');
                        }
                        if (!!this.initialized) return [3, 2];
                        return [4, this.initialize()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        startTime = performance.now();
                        inputTensors = tf.tidy(function () { return tf.stack(inputSequences.map(function (t) { return _this.dataConverter.toTensor(t); })); });
                        if (!this.dataConverter.endTensor) return [3, 4];
                        return [4, this.getSegmentLengths(inputTensors)];
                    case 3:
                        _a = _b.sent();
                        return [3, 5];
                    case 4:
                        _a = undefined;
                        _b.label = 5;
                    case 5:
                        segmentLengths = _a;
                        if (this.chordEncoder) {
                            newInputTensors = tf.tidy(function () {
                                var encodedChords = _this.encodeChordProgression(chordProgression);
                                var controls = tf.tile(tf.expandDims(encodedChords, 0), [inputSequences.length, 1, 1]);
                                return inputTensors.concat(controls, 2);
                            });
                            inputTensors.dispose();
                            inputTensors = newInputTensors;
                        }
                        z = this.encoder.encode(inputTensors, segmentLengths);
                        inputTensors.dispose();
                        logging.logWithDuration('Encoding completed', startTime, 'MusicVAE', 20);
                        return [2, z];
                }
            });
        });
    };
    MusicVAE.prototype.decode = function (z, temperature, chordProgression, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = 4; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, numSteps, ohSeqs, outputSequences, _i, ohSeqs_1, oh, _a, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.chordEncoder && !chordProgression) {
                            throw new Error('Chord progression expected but not provided.');
                        }
                        if (!this.chordEncoder && chordProgression) {
                            throw new Error('Unexpected chord progression provided.');
                        }
                        if (this.chordEncoder && this.dataConverter.endTensor &&
                            chordProgression.length > 1) {
                            throw new Error('Multiple chords not supported when using variable-length segments.');
                        }
                        if (!!this.initialized) return [3, 2];
                        return [4, this.initialize()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        startTime = performance.now();
                        numSteps = this.dataConverter.numSteps;
                        ohSeqs = tf.tidy(function () {
                            var controls = _this.chordEncoder ?
                                _this.encodeChordProgression(chordProgression) :
                                undefined;
                            var ohSeqs = _this.decoder.decode(z, numSteps, undefined, temperature, controls);
                            return tf.split(ohSeqs, ohSeqs.shape[0])
                                .map(function (oh) { return oh.squeeze([0]); });
                        });
                        outputSequences = [];
                        _i = 0, ohSeqs_1 = ohSeqs;
                        _c.label = 3;
                    case 3:
                        if (!(_i < ohSeqs_1.length)) return [3, 6];
                        oh = ohSeqs_1[_i];
                        _b = (_a = outputSequences).push;
                        return [4, this.dataConverter.toNoteSequence(oh, stepsPerQuarter)];
                    case 4:
                        _b.apply(_a, [_c.sent()]);
                        oh.dispose();
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3, 3];
                    case 6:
                        logging.logWithDuration('Decoding completed', startTime, 'MusicVAE', 20);
                        return [2, outputSequences];
                }
            });
        });
    };
    MusicVAE.prototype.getInterpolatedZs = function (z, numInterps) {
        if (typeof numInterps === 'number') {
            numInterps = [numInterps];
        }
        if (z.shape[0] !== 2 && z.shape[0] !== 4) {
            throw new Error('Invalid number of input sequences. Requires length 2, or 4');
        }
        if (numInterps.length !== 1 && numInterps.length !== 2) {
            throw new Error('Invalid number of dimensions. Requires length 1, or 2.');
        }
        var w = numInterps[0];
        var h = numInterps.length === 2 ? numInterps[1] : w;
        var interpolatedZs = tf.tidy(function () {
            var rangeX = tf.linspace(0.0, 1.0, w);
            var z0 = z.slice([0, 0], [1, z.shape[1]]).as1D();
            var z1 = z.slice([1, 0], [1, z.shape[1]]).as1D();
            if (z.shape[0] === 2) {
                var zDiff = z1.sub(z0);
                return tf.outerProduct(rangeX, zDiff).add(z0);
            }
            else if (z.shape[0] === 4) {
                var rangeY = tf.linspace(0.0, 1.0, h);
                var z2 = z.slice([2, 0], [1, z.shape[1]]).as1D();
                var z3 = z.slice([3, 0], [1, z.shape[1]]).as1D();
                var revRangeX = tf.scalar(1.0).sub(rangeX);
                var revRangeY = tf.scalar(1.0).sub(rangeY);
                var finalZs = z0.mul(tf.outerProduct(revRangeY, revRangeX).as3D(h, w, 1));
                finalZs = tf.addStrict(finalZs, z1.mul(tf.outerProduct(rangeY, revRangeX).as3D(h, w, 1)));
                finalZs = tf.addStrict(finalZs, z2.mul(tf.outerProduct(revRangeY, rangeX).as3D(h, w, 1)));
                finalZs = tf.addStrict(finalZs, z3.mul(tf.outerProduct(rangeY, rangeX).as3D(h, w, 1)));
                return finalZs.as2D(w * h, z.shape[1]);
            }
            else {
                throw new Error('Invalid number of note sequences. Requires length 2, or 4');
            }
        });
        return interpolatedZs;
    };
    MusicVAE.prototype.sample = function (numSamples, temperature, chordProgression, stepsPerQuarter) {
        if (temperature === void 0) { temperature = 0.5; }
        if (stepsPerQuarter === void 0) { stepsPerQuarter = constants.DEFAULT_STEPS_PER_QUARTER; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, randZs, outputSequences;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.chordEncoder && !chordProgression) {
                            throw new Error('Chord progression expected but not provided.');
                        }
                        if (!this.chordEncoder && chordProgression) {
                            throw new Error('Unexpected chord progression provided.');
                        }
                        if (!!this.initialized) return [3, 2];
                        return [4, this.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        startTime = performance.now();
                        randZs = tf.tidy(function () { return tf.randomNormal([numSamples, _this.decoder.zDims]); });
                        outputSequences = this.decode(randZs, temperature, chordProgression, stepsPerQuarter);
                        randZs.dispose();
                        outputSequences.then(function () { return logging.logWithDuration('Sampling completed', startTime, 'MusicVAE', 20); });
                        return [2, outputSequences];
                }
            });
        });
    };
    return MusicVAE;
}());
exports.MusicVAE = MusicVAE;
//# sourceMappingURL=model.js.map