"use strict";
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
var index_1 = require("../protobuf/index");
var constants = require("./constants");
var performance = require("./performance");
var sequences = require("./sequences");
exports.DEFAULT_DRUM_PITCH_CLASSES = [
    [36, 35],
    [38, 27, 28, 31, 32, 33, 34, 37, 39, 40, 56, 65, 66, 75, 85],
    [42, 44, 54, 68, 69, 70, 71, 73, 78, 80],
    [46, 67, 72, 74, 79, 81],
    [45, 29, 41, 61, 64, 84],
    [48, 47, 60, 63, 77, 86, 87],
    [50, 30, 43, 62, 76, 83],
    [49, 55, 57, 58],
    [51, 52, 53, 59, 82]
];
function converterFromSpec(spec) {
    switch (spec.type) {
        case 'MelodyConverter':
            return new MelodyConverter(spec.args);
        case 'DrumsConverter':
            return new DrumsConverter(spec.args);
        case 'DrumRollConverter':
            return new DrumRollConverter(spec.args);
        case 'TrioConverter':
            return new TrioConverter(spec.args);
        case 'DrumsOneHotConverter':
            return new DrumsOneHotConverter(spec.args);
        case 'MultitrackConverter':
            return new MultitrackConverter(spec.args);
        case 'GrooveConverter':
            return new GrooveConverter(spec.args);
        default:
            throw new Error("Unknown DataConverter type: " + spec);
    }
}
exports.converterFromSpec = converterFromSpec;
var DataConverter = (function () {
    function DataConverter(args) {
        this.NUM_SPLITS = 0;
        this.SEGMENTED_BY_TRACK = false;
        this.numSteps = args.numSteps;
        this.numSegments = args.numSegments;
    }
    DataConverter.prototype.tensorSteps = function (tensor) {
        return tf.scalar(tensor.shape[0], 'int32');
    };
    return DataConverter;
}());
exports.DataConverter = DataConverter;
var DrumsConverter = (function (_super) {
    __extends(DrumsConverter, _super);
    function DrumsConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.pitchClasses = args.pitchClasses || exports.DEFAULT_DRUM_PITCH_CLASSES;
        _this.pitchToClass = new Map();
        var _loop_1 = function (c) {
            this_1.pitchClasses[c].forEach(function (p) {
                _this.pitchToClass.set(p, c);
            });
        };
        var this_1 = this;
        for (var c = 0; c < _this.pitchClasses.length; ++c) {
            _loop_1(c);
        }
        _this.depth = _this.pitchClasses.length;
        return _this;
    }
    DrumsConverter.prototype.toTensor = function (noteSequence) {
        var _this = this;
        sequences.assertIsQuantizedSequence(noteSequence);
        var numSteps = this.numSteps || noteSequence.totalQuantizedSteps;
        var drumRoll = tf.buffer([numSteps, this.pitchClasses.length + 1]);
        for (var i = 0; i < numSteps; ++i) {
            drumRoll.set(1, i, -1);
        }
        noteSequence.notes.forEach(function (note) {
            drumRoll.set(1, note.quantizedStartStep, _this.pitchToClass.get(note.pitch));
            drumRoll.set(0, note.quantizedStartStep, -1);
        });
        return drumRoll.toTensor();
    };
    DrumsConverter.prototype.toNoteSequence = function (oh, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = constants.DEFAULT_QUARTERS_PER_MINUTE; }
        return __awaiter(this, void 0, void 0, function () {
            var noteSequence, labelsTensor, labels, s, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noteSequence = index_1.NoteSequence.create();
                        noteSequence.quantizationInfo =
                            index_1.NoteSequence.QuantizationInfo.create({ stepsPerQuarter: stepsPerQuarter });
                        labelsTensor = oh.argMax(1);
                        return [4, labelsTensor.data()];
                    case 1:
                        labels = _a.sent();
                        labelsTensor.dispose();
                        for (s = 0; s < labels.length; ++s) {
                            for (p = 0; p < this.pitchClasses.length; p++) {
                                if (labels[s] >> p & 1) {
                                    noteSequence.notes.push(index_1.NoteSequence.Note.create({
                                        pitch: this.pitchClasses[p][0],
                                        quantizedStartStep: s,
                                        quantizedEndStep: s + 1,
                                        isDrum: true
                                    }));
                                }
                            }
                        }
                        noteSequence.totalQuantizedSteps = labels.length;
                        return [2, noteSequence];
                }
            });
        });
    };
    return DrumsConverter;
}(DataConverter));
exports.DrumsConverter = DrumsConverter;
var DrumRollConverter = (function (_super) {
    __extends(DrumRollConverter, _super);
    function DrumRollConverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DrumRollConverter.prototype.toNoteSequence = function (roll, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = constants.DEFAULT_QUARTERS_PER_MINUTE; }
        return __awaiter(this, void 0, void 0, function () {
            var noteSequence, flatRoll, s, pitches, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noteSequence = index_1.NoteSequence.create();
                        noteSequence.quantizationInfo =
                            index_1.NoteSequence.QuantizationInfo.create({ stepsPerQuarter: stepsPerQuarter });
                        return [4, roll.data()];
                    case 1:
                        flatRoll = _a.sent();
                        for (s = 0; s < roll.shape[0]; ++s) {
                            pitches = flatRoll.slice(s * this.depth, (s + 1) * this.depth);
                            for (p = 0; p < pitches.length; ++p) {
                                if (pitches[p]) {
                                    noteSequence.notes.push(index_1.NoteSequence.Note.create({
                                        pitch: this.pitchClasses[p][0],
                                        quantizedStartStep: s,
                                        quantizedEndStep: s + 1,
                                        isDrum: true
                                    }));
                                }
                            }
                        }
                        noteSequence.totalQuantizedSteps = roll.shape[0];
                        return [2, noteSequence];
                }
            });
        });
    };
    return DrumRollConverter;
}(DrumsConverter));
exports.DrumRollConverter = DrumRollConverter;
var DrumsOneHotConverter = (function (_super) {
    __extends(DrumsOneHotConverter, _super);
    function DrumsOneHotConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.depth = Math.pow(2, _this.pitchClasses.length);
        return _this;
    }
    DrumsOneHotConverter.prototype.toTensor = function (noteSequence) {
        var _this = this;
        sequences.assertIsRelativeQuantizedSequence(noteSequence);
        var numSteps = this.numSteps || noteSequence.totalQuantizedSteps;
        var labels = Array(numSteps).fill(0);
        for (var _i = 0, _a = noteSequence.notes; _i < _a.length; _i++) {
            var _b = _a[_i], pitch = _b.pitch, quantizedStartStep = _b.quantizedStartStep;
            labels[quantizedStartStep] += Math.pow(2, this.pitchToClass.get(pitch));
        }
        return tf.tidy(function () { return tf.oneHot(tf.tensor1d(labels, 'int32'), _this.depth); });
    };
    return DrumsOneHotConverter;
}(DrumsConverter));
exports.DrumsOneHotConverter = DrumsOneHotConverter;
var MelodyConverter = (function (_super) {
    __extends(MelodyConverter, _super);
    function MelodyConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.NOTE_OFF = 1;
        _this.FIRST_PITCH = 2;
        _this.minPitch = args.minPitch;
        _this.maxPitch = args.maxPitch;
        _this.ignorePolyphony =
            (args.ignorePolyphony === undefined) ? true : args.ignorePolyphony;
        _this.depth = args.maxPitch - args.minPitch + 1 + _this.FIRST_PITCH;
        return _this;
    }
    MelodyConverter.prototype.toTensor = function (noteSequence) {
        var _this = this;
        sequences.assertIsQuantizedSequence(noteSequence);
        var numSteps = this.numSteps || noteSequence.totalQuantizedSteps;
        var sortedNotes = noteSequence.notes.sort(function (n1, n2) {
            if (n1.quantizedStartStep === n2.quantizedStartStep) {
                return n2.pitch - n1.pitch;
            }
            return n1.quantizedStartStep - n2.quantizedStartStep;
        });
        var mel = tf.buffer([numSteps], 'int32');
        var lastStart = -1;
        sortedNotes.forEach(function (n) {
            if (n.quantizedStartStep === lastStart) {
                if (!_this.ignorePolyphony) {
                    throw new Error('`NoteSequence` is not monophonic.');
                }
                else {
                    return;
                }
            }
            if (n.pitch < _this.minPitch || n.pitch > _this.maxPitch) {
                throw Error('`NoteSequence` has a pitch outside of the valid range: ' +
                    ("" + n.pitch));
            }
            mel.set(n.pitch - _this.minPitch + _this.FIRST_PITCH, n.quantizedStartStep);
            mel.set(_this.NOTE_OFF, n.quantizedEndStep);
            lastStart = n.quantizedStartStep;
        });
        return tf.tidy(function () { return tf.oneHot(mel.toTensor(), _this.depth); });
    };
    MelodyConverter.prototype.toNoteSequence = function (oh, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = constants.DEFAULT_QUARTERS_PER_MINUTE; }
        return __awaiter(this, void 0, void 0, function () {
            var noteSequence, labelsTensor, labels, currNote, s, label;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noteSequence = index_1.NoteSequence.create();
                        noteSequence.quantizationInfo =
                            index_1.NoteSequence.QuantizationInfo.create({ stepsPerQuarter: stepsPerQuarter });
                        labelsTensor = oh.argMax(1);
                        return [4, labelsTensor.data()];
                    case 1:
                        labels = _a.sent();
                        labelsTensor.dispose();
                        currNote = null;
                        for (s = 0; s < labels.length; ++s) {
                            label = labels[s];
                            switch (label) {
                                case 0:
                                    break;
                                case 1:
                                    if (currNote) {
                                        currNote.quantizedEndStep = s;
                                        noteSequence.notes.push(currNote);
                                        currNote = null;
                                    }
                                    break;
                                default:
                                    if (currNote) {
                                        currNote.quantizedEndStep = s;
                                        noteSequence.notes.push(currNote);
                                    }
                                    currNote = index_1.NoteSequence.Note.create({
                                        pitch: label - this.FIRST_PITCH + this.minPitch,
                                        quantizedStartStep: s
                                    });
                            }
                        }
                        if (currNote) {
                            currNote.quantizedEndStep = labels.length;
                            noteSequence.notes.push(currNote);
                        }
                        noteSequence.totalQuantizedSteps = labels.length;
                        return [2, noteSequence];
                }
            });
        });
    };
    return MelodyConverter;
}(DataConverter));
exports.MelodyConverter = MelodyConverter;
var TrioConverter = (function (_super) {
    __extends(TrioConverter, _super);
    function TrioConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.NUM_SPLITS = 3;
        _this.MEL_PROG_RANGE = [0, 31];
        _this.BASS_PROG_RANGE = [32, 39];
        args.melArgs.numSteps = args.numSteps;
        args.bassArgs.numSteps = args.numSteps;
        args.drumsArgs.numSteps = args.numSteps;
        _this.melConverter = new MelodyConverter(args.melArgs);
        _this.bassConverter = new MelodyConverter(args.bassArgs);
        _this.drumsConverter = new DrumsOneHotConverter(args.drumsArgs);
        _this.depth =
            (_this.melConverter.depth + _this.bassConverter.depth +
                _this.drumsConverter.depth);
        return _this;
    }
    TrioConverter.prototype.toTensor = function (noteSequence) {
        var _this = this;
        sequences.assertIsQuantizedSequence(noteSequence);
        var melSeq = sequences.clone(noteSequence);
        var bassSeq = sequences.clone(noteSequence);
        var drumsSeq = sequences.clone(noteSequence);
        melSeq.notes = noteSequence.notes.filter(function (n) {
            return (!n.isDrum && n.program >= _this.MEL_PROG_RANGE[0] &&
                n.program <= _this.MEL_PROG_RANGE[1]);
        });
        bassSeq.notes = noteSequence.notes.filter(function (n) {
            return (!n.isDrum && n.program >= _this.BASS_PROG_RANGE[0] &&
                n.program <= _this.BASS_PROG_RANGE[1]);
        });
        drumsSeq.notes = noteSequence.notes.filter(function (n) { return n.isDrum; });
        return tf.tidy(function () { return tf.concat([
            _this.melConverter.toTensor(melSeq),
            _this.bassConverter.toTensor(bassSeq),
            _this.drumsConverter.toTensor(drumsSeq)
        ], -1); });
    };
    TrioConverter.prototype.toNoteSequence = function (th, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = constants.DEFAULT_QUARTERS_PER_MINUTE; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, ohs, ns, bassNs, drumsNs;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ohs = tf.split(th, [
                            this.melConverter.depth, this.bassConverter.depth,
                            this.drumsConverter.depth
                        ], -1);
                        return [4, this.melConverter.toNoteSequence(ohs[0], stepsPerQuarter)];
                    case 1:
                        ns = _c.sent();
                        ns.notes.forEach(function (n) {
                            n.instrument = 0;
                            n.program = 0;
                        });
                        return [4, this.bassConverter.toNoteSequence(ohs[1])];
                    case 2:
                        bassNs = _c.sent();
                        (_a = ns.notes).push.apply(_a, bassNs.notes.map(function (n) {
                            n.instrument = 1;
                            n.program = _this.BASS_PROG_RANGE[0];
                            return n;
                        }));
                        return [4, this.drumsConverter.toNoteSequence(ohs[2])];
                    case 3:
                        drumsNs = _c.sent();
                        (_b = ns.notes).push.apply(_b, drumsNs.notes.map(function (n) {
                            n.instrument = 2;
                            return n;
                        }));
                        ohs.forEach(function (oh) { return oh.dispose(); });
                        return [2, ns];
                }
            });
        });
    };
    return TrioConverter;
}(DataConverter));
exports.TrioConverter = TrioConverter;
var MultitrackConverter = (function (_super) {
    __extends(MultitrackConverter, _super);
    function MultitrackConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.SEGMENTED_BY_TRACK = true;
        _this.stepsPerQuarter = args.stepsPerQuarter;
        _this.totalSteps = args.totalSteps;
        _this.numVelocityBins = args.numVelocityBins;
        _this.minPitch = args.minPitch ? args.minPitch : constants.MIN_MIDI_PITCH;
        _this.maxPitch = args.maxPitch ? args.maxPitch : constants.MAX_MIDI_PITCH;
        _this.numPitches = _this.maxPitch - _this.minPitch + 1;
        _this.performanceEventDepth =
            2 * _this.numPitches + _this.totalSteps + _this.numVelocityBins;
        _this.numPrograms =
            constants.MAX_MIDI_PROGRAM - constants.MIN_MIDI_PROGRAM + 2;
        _this.endToken = _this.performanceEventDepth + _this.numPrograms;
        _this.depth = _this.endToken + 1;
        _this.endTensor = tf.tidy(function () { return tf.oneHot(tf.tensor1d([_this.endToken], 'int32'), _this.depth)
            .as1D(); });
        return _this;
    }
    MultitrackConverter.prototype.trackToTensor = function (track) {
        var _this = this;
        var maxEventsPerTrack = this.numSteps / this.numSegments;
        var tokens = undefined;
        if (track) {
            while (track.events.length > maxEventsPerTrack - 2) {
                track.events.pop();
            }
            tokens = tf.buffer([track.events.length + 2], 'int32');
            tokens.set(this.performanceEventDepth +
                (track.isDrum ? this.numPrograms - 1 : track.program), 0);
            track.events.forEach(function (event, index) {
                switch (event.type) {
                    case 'note-on':
                        tokens.set(event.pitch - _this.minPitch, index + 1);
                        break;
                    case 'note-off':
                        tokens.set(_this.numPitches + event.pitch - _this.minPitch, index + 1);
                        break;
                    case 'time-shift':
                        tokens.set(2 * _this.numPitches + event.steps - 1, index + 1);
                        break;
                    case 'velocity-change':
                        tokens.set(2 * _this.numPitches + _this.totalSteps + event.velocityBin - 1, index + 1);
                        break;
                    default:
                        throw new Error("Unrecognized performance event: " + event);
                }
            });
            tokens.set(this.endToken, track.events.length + 1);
        }
        else {
            tokens = tf.buffer([1], 'int32', new Int32Array([this.endToken]));
        }
        return tf.tidy(function () {
            var oh = tf.oneHot(tokens.toTensor(), _this.depth);
            return oh.pad([[0, maxEventsPerTrack - oh.shape[0]], [0, 0]]);
        });
    };
    MultitrackConverter.prototype.toTensor = function (noteSequence) {
        var _this = this;
        sequences.assertIsRelativeQuantizedSequence(noteSequence);
        if (noteSequence.quantizationInfo.stepsPerQuarter !==
            this.stepsPerQuarter) {
            throw new Error("Steps per quarter note mismatch: " + noteSequence.quantizationInfo.stepsPerQuarter + " != " + this.stepsPerQuarter);
        }
        var seq = sequences.clone(noteSequence);
        seq.notes = noteSequence.notes.filter(function (note) { return note.pitch >= _this.minPitch && note.pitch <= _this.maxPitch; });
        var instruments = new Set(seq.notes.map(function (note) { return note.instrument; }));
        var tracks = Array.from(instruments)
            .map(function (instrument) { return performance.Performance.fromNoteSequence(seq, _this.totalSteps, _this.numVelocityBins, instrument); });
        var sortedTracks = tracks.sort(function (a, b) { return b.isDrum ? -1 : (a.isDrum ? 1 : a.program - b.program); });
        while (sortedTracks.length > this.numSegments) {
            sortedTracks.pop();
        }
        sortedTracks.forEach(function (track) { return track.setNumSteps(_this.totalSteps); });
        while (sortedTracks.length < this.numSegments) {
            sortedTracks.push(undefined);
        }
        return tf.tidy(function () { return tf.concat(sortedTracks.map(function (track) { return _this.trackToTensor(track); }), 0); });
    };
    MultitrackConverter.prototype.tokensToTrack = function (tokens) {
        var _this = this;
        var idx = tokens.indexOf(this.endToken);
        var endIndex = idx >= 0 ? idx : tokens.length;
        var trackTokens = tokens.slice(0, endIndex);
        var eventTokens = trackTokens.filter(function (token) { return token < _this.performanceEventDepth; });
        var programTokens = trackTokens.filter(function (token) { return token >= _this.performanceEventDepth; });
        var _a = programTokens.length ?
            (programTokens[0] - this.performanceEventDepth < this.numPrograms - 1 ?
                [programTokens[0] - this.performanceEventDepth, false] :
                [0, true]) :
            [0, false], program = _a[0], isDrum = _a[1];
        var events = Array.from(eventTokens).map(function (token) {
            if (token < _this.numPitches) {
                return { type: 'note-on', pitch: _this.minPitch + token };
            }
            else if (token < 2 * _this.numPitches) {
                return {
                    type: 'note-off',
                    pitch: _this.minPitch + token - _this.numPitches
                };
            }
            else if (token < 2 * _this.numPitches + _this.totalSteps) {
                return {
                    type: 'time-shift',
                    steps: token - 2 * _this.numPitches + 1
                };
            }
            else if (token <
                2 * _this.numPitches + _this.totalSteps + _this.numVelocityBins) {
                return {
                    type: 'velocity-change',
                    velocityBin: token - 2 * _this.numPitches - _this.totalSteps + 1
                };
            }
            else {
                throw new Error("Invalid performance event token: " + token);
            }
        });
        return new performance.Performance(events, this.totalSteps, this.numVelocityBins, program, isDrum);
    };
    MultitrackConverter.prototype.toNoteSequence = function (oh, stepsPerQuarter) {
        if (stepsPerQuarter === void 0) { stepsPerQuarter = this.stepsPerQuarter; }
        return __awaiter(this, void 0, void 0, function () {
            var noteSequence, tensors, tracks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noteSequence = index_1.NoteSequence.create();
                        noteSequence.quantizationInfo =
                            index_1.NoteSequence.QuantizationInfo.create({ stepsPerQuarter: stepsPerQuarter });
                        noteSequence.totalQuantizedSteps = this.totalSteps;
                        tensors = tf.tidy(function () { return tf.split(oh.argMax(1), _this.numSegments); });
                        return [4, Promise.all(tensors.map(function (tensor) { return __awaiter(_this, void 0, void 0, function () {
                                var tokens, track;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, tensor.data()];
                                        case 1:
                                            tokens = _a.sent();
                                            track = this.tokensToTrack(tokens);
                                            tensor.dispose();
                                            return [2, track];
                                    }
                                });
                            }); }))];
                    case 1:
                        tracks = _a.sent();
                        tracks.forEach(function (track, instrument) {
                            var _a;
                            track.setNumSteps(_this.totalSteps);
                            (_a = noteSequence.notes).push.apply(_a, track.toNoteSequence(instrument).notes);
                        });
                        return [2, noteSequence];
                }
            });
        });
    };
    return MultitrackConverter;
}(DataConverter));
exports.MultitrackConverter = MultitrackConverter;
var GrooveConverter = (function (_super) {
    __extends(GrooveConverter, _super);
    function GrooveConverter(args) {
        var _this = _super.call(this, args) || this;
        _this.TAPIFY_CHANNEL = 3;
        _this.stepsPerQuarter =
            args.stepsPerQuarter || constants.DEFAULT_STEPS_PER_QUARTER;
        _this.pitchClasses = args.pitchClasses || exports.DEFAULT_DRUM_PITCH_CLASSES;
        _this.pitchToClass = new Map();
        var _loop_2 = function (c) {
            this_2.pitchClasses[c].forEach(function (p) {
                _this.pitchToClass.set(p, c);
            });
        };
        var this_2 = this;
        for (var c = 0; c < _this.pitchClasses.length; ++c) {
            _loop_2(c);
        }
        _this.humanize = args.humanize || false;
        _this.tapify = args.tapify || false;
        _this.splitInstruments = args.splitInstruments || false;
        _this.depth = 3;
        return _this;
    }
    GrooveConverter.prototype.toTensor = function (ns) {
        var _this = this;
        var qns = sequences.isRelativeQuantizedSequence(ns) ?
            ns :
            sequences.quantizeNoteSequence(ns, this.stepsPerQuarter);
        var numSteps = this.numSteps || qns.totalQuantizedSteps;
        var qpm = (qns.tempos && qns.tempos.length) ?
            qns.tempos[0].qpm :
            constants.DEFAULT_QUARTERS_PER_MINUTE;
        var stepLength = (60. / qpm) / this.stepsPerQuarter;
        var stepNotes = [];
        for (var i = 0; i < numSteps; ++i) {
            stepNotes.push(new Map());
        }
        qns.notes.forEach(function (n) {
            if (_this.pitchToClass.has(n.pitch)) {
                var s = n.quantizedStartStep;
                var d = _this.pitchToClass.get(n.pitch);
                if (!stepNotes[s].has(d) || stepNotes[s].get(d).velocity < n.velocity) {
                    stepNotes[s].set(d, n);
                }
            }
        });
        var numDrums = this.pitchClasses.length;
        var hitVectors = tf.buffer([numSteps, numDrums]);
        var velocityVectors = tf.buffer([numSteps, numDrums]);
        var offsetVectors = tf.buffer([numSteps, numDrums]);
        function getOffset(n) {
            if (n.startTime === undefined) {
                return 0;
            }
            var tOnset = n.startTime;
            var qOnset = n.quantizedStartStep * stepLength;
            return 2 * (qOnset - tOnset) / stepLength;
        }
        var _loop_3 = function (s) {
            if (this_3.tapify) {
                var maxVelNote_1 = null;
                stepNotes[s].forEach(function (n) { return maxVelNote_1 = (maxVelNote_1 && maxVelNote_1.velocity > n.velocity) ?
                    maxVelNote_1 :
                    n; });
                if (maxVelNote_1) {
                    hitVectors.set(1, s, this_3.TAPIFY_CHANNEL);
                    offsetVectors.set(getOffset(maxVelNote_1), s, this_3.TAPIFY_CHANNEL);
                }
            }
            else {
                for (var d = 0; d < numDrums; ++d) {
                    var note = stepNotes[s].get(d);
                    hitVectors.set(note ? 1 : 0, s, d);
                    if (!this_3.humanize) {
                        velocityVectors.set(note ? note.velocity / 127 : 0, s, d);
                        offsetVectors.set(note ? getOffset(note) : 0, s, d);
                    }
                }
            }
        };
        var this_3 = this;
        for (var s = 0; s < numSteps; ++s) {
            _loop_3(s);
        }
        return tf.tidy(function () {
            var hits = hitVectors.toTensor();
            var velocities = velocityVectors.toTensor();
            var offsets = offsetVectors.toTensor();
            var outLength = _this.splitInstruments ? numSteps * numDrums : numSteps;
            return tf.concat([
                hits.as2D(outLength, -1), velocities.as2D(outLength, -1),
                offsets.as2D(outLength, -1)
            ], 1);
        });
    };
    GrooveConverter.prototype.toNoteSequence = function (t, stepsPerQuarter, qpm) {
        if (qpm === void 0) { qpm = constants.DEFAULT_QUARTERS_PER_MINUTE; }
        return __awaiter(this, void 0, void 0, function () {
            function clip(v, min, max) {
                return Math.min(Math.max(v, min), max);
            }
            var numSteps, stepLength, ns, results, numDrums, s, stepResults, d, hitOutput, velI, velOutput, offsetI, offsetOutput, velocity, offset;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (stepsPerQuarter && stepsPerQuarter !== this.stepsPerQuarter) {
                            throw Error('`stepsPerQuarter` is set by the model.');
                        }
                        stepsPerQuarter = this.stepsPerQuarter;
                        numSteps = this.splitInstruments ?
                            t.shape[0] / this.pitchClasses.length :
                            t.shape[0];
                        stepLength = (60. / qpm) / this.stepsPerQuarter;
                        ns = index_1.NoteSequence.create({ totalTime: numSteps * stepLength });
                        ns.tempos.push({ qpm: qpm });
                        return [4, t.data()];
                    case 1:
                        results = _a.sent();
                        numDrums = this.pitchClasses.length;
                        for (s = 0; s < numSteps; ++s) {
                            stepResults = results.slice(s * numDrums * this.depth, (s + 1) * numDrums * this.depth);
                            for (d = 0; d < numDrums; ++d) {
                                hitOutput = stepResults[this.splitInstruments ? d * this.depth : d];
                                velI = this.splitInstruments ? (d * this.depth + 1) : (numDrums + d);
                                velOutput = stepResults[velI];
                                offsetI = this.splitInstruments ? (d * this.depth + 2) : (2 * numDrums + d);
                                offsetOutput = stepResults[offsetI];
                                if (hitOutput > 0.5) {
                                    velocity = clip(Math.round(velOutput * 127), 0, 127);
                                    offset = clip(offsetOutput / 2, -0.5, 0.5);
                                    ns.notes.push(index_1.NoteSequence.Note.create({
                                        pitch: this.pitchClasses[d][0],
                                        startTime: (s - offset) * stepLength,
                                        endTime: (s - offset + 1) * stepLength,
                                        velocity: velocity,
                                        isDrum: true
                                    }));
                                }
                            }
                        }
                        return [2, ns];
                }
            });
        });
    };
    return GrooveConverter;
}(DataConverter));
exports.GrooveConverter = GrooveConverter;
//# sourceMappingURL=data.js.map