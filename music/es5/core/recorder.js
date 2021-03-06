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
var protobuf_1 = require("../protobuf");
var Tone = require("tone");
var constants_1 = require("./constants");
var BaseRecorderCallback = (function () {
    function BaseRecorderCallback() {
    }
    return BaseRecorderCallback;
}());
exports.BaseRecorderCallback = BaseRecorderCallback;
var Recorder = (function () {
    function Recorder(config, callbackObject) {
        if (config === void 0) { config = {}; }
        this.notes = [];
        this.midiInputs = [];
        this.loClick = new Tone
            .MembraneSynth({
            pitchDecay: 0.008,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
        })
            .toMaster();
        this.hiClick = new Tone
            .MembraneSynth({
            pitchDecay: 0.008,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
        })
            .toMaster();
        this.config = {
            playClick: config.playClick,
            qpm: config.qpm || constants_1.DEFAULT_QUARTERS_PER_MINUTE,
            playCountIn: config.playCountIn,
            startRecordingAtFirstNote: config.startRecordingAtFirstNote || false
        };
        this.callbackObject = callbackObject;
        this.recording = false;
        this.onNotes = new Map();
    }
    Recorder.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, navigator
                            .requestMIDIAccess()
                            .then(function (midi) { return _this.midiReady(midi); }, function (err) { return console.log('Something went wrong', err); })];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Recorder.prototype.midiReady = function (midi) {
        console.log('Initialized Recorder');
        var inputs = midi.inputs.values();
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            this.midiInputs.push(input.value);
        }
    };
    Recorder.prototype.isRecording = function () {
        return this.recording;
    };
    Recorder.prototype.setTempo = function (qpm) {
        this.config.qpm = qpm;
        if (Tone.Transport.state === 'started') {
            Tone.Transport.bpm.value = qpm;
        }
    };
    Recorder.prototype.enablePlayClick = function (playClick) {
        this.config.playClick = playClick;
    };
    Recorder.prototype.enablePlayCountIn = function (countIn) {
        this.config.playCountIn = countIn;
    };
    Recorder.prototype.initClickLoop = function () {
        var _this = this;
        var clickStep = 0;
        this.clickLoop = new Tone.Loop(function (_) {
            if (clickStep % 4 === 0) {
                _this.loClick.triggerAttack('G5');
            }
            else {
                _this.hiClick.triggerAttack('C6');
            }
            clickStep++;
            if (_this.config.playCountIn && clickStep === 4) {
                Tone.Transport.stop();
                _this.clickLoop.stop();
            }
        }, '4n');
    };
    Recorder.prototype.getMIDIInputs = function () {
        return this.midiInputs;
    };
    Recorder.prototype.start = function (midiInputs) {
        var _this = this;
        var list = midiInputs ? midiInputs : this.midiInputs;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var input = list_1[_i];
            input.onmidimessage = function (event) {
                _this.midiMessageReceived(event);
            };
        }
        if (this.config.playClick || this.config.playCountIn) {
            this.initClickLoop();
            Tone.Transport.bpm.value = this.config.qpm;
            Tone.Transport.start();
            this.clickLoop.start();
        }
        else {
            this.clickLoop = null;
        }
        this.recording = true;
        this.firstNoteTimestamp = undefined;
        this.notes = [];
        this.onNotes = new Map();
        if (!this.startRecordingAtFirstNote) {
            var timeStamp = Date.now();
            this.firstNoteTimestamp = timeStamp;
        }
    };
    Recorder.prototype.stop = function () {
        var _this = this;
        this.recording = false;
        var timeStamp = Date.now();
        this.onNotes.forEach(function (pitch, note) {
            _this.noteOff(note, timeStamp);
        });
        for (var _i = 0, _a = this.midiInputs; _i < _a.length; _i++) {
            var input = _a[_i];
            input.onmidimessage = null;
        }
        if (this.clickLoop) {
            Tone.Transport.stop();
            this.clickLoop.stop();
        }
        if (this.notes.length === 0) {
            return null;
        }
        return this.getNoteSequence();
    };
    Recorder.prototype.getNoteSequence = function () {
        if (this.notes.length === 0) {
            return null;
        }
        return protobuf_1.NoteSequence.create({
            notes: this.notes,
            totalTime: this.notes[this.notes.length - 1].endTime,
        });
    };
    Recorder.prototype.reset = function () {
        var noteSequence = this.stop();
        this.firstNoteTimestamp = undefined;
        this.notes = [];
        this.onNotes = new Map();
        return noteSequence;
    };
    Recorder.prototype.midiMessageReceived = function (event) {
        if (!this.recording) {
            return;
        }
        var timeStamp = Date.now();
        if (this.firstNoteTimestamp === undefined) {
            this.firstNoteTimestamp = timeStamp;
        }
        var NOTE_ON = 9;
        var NOTE_OFF = 8;
        var cmd = event.data[0] >> 4;
        var pitch = event.data[1];
        var velocity = (event.data.length > 2) ? event.data[2] : 1;
        if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
            this.noteOff(pitch, timeStamp);
            if (this.callbackObject) {
                this.callbackObject.run(this.getNoteSequence());
            }
        }
        else if (cmd === NOTE_ON) {
            this.noteOn(pitch, velocity, timeStamp);
        }
    };
    Recorder.prototype.noteOn = function (pitch, velocity, timeStamp) {
        var MILLIS_PER_SECOND = 1000;
        var note = new protobuf_1.NoteSequence.Note();
        note.pitch = pitch;
        note.startTime = (timeStamp - this.firstNoteTimestamp) / MILLIS_PER_SECOND;
        note.velocity = velocity;
        this.onNotes.set(pitch, note);
    };
    Recorder.prototype.noteOff = function (pitch, timeStamp) {
        var MILLIS_PER_SECOND = 1000;
        var note = this.onNotes.get(pitch);
        if (note) {
            note.endTime = (timeStamp - this.firstNoteTimestamp) / MILLIS_PER_SECOND;
            this.notes.push(note);
        }
        this.onNotes.delete(pitch);
    };
    return Recorder;
}());
exports.Recorder = Recorder;
//# sourceMappingURL=recorder.js.map