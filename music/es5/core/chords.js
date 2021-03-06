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
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs-core");
var tonal_1 = require("tonal");
var constants = require("./constants");
var CHORD_QUALITY_INTERVALS = [
    ['1P', '3M', '5P'],
    ['1P', '3m', '5P'],
    ['1P', '3M', '5A'],
    ['1P', '3m', '5d'],
];
var ChordQuality;
(function (ChordQuality) {
    ChordQuality[ChordQuality["Major"] = 0] = "Major";
    ChordQuality[ChordQuality["Minor"] = 1] = "Minor";
    ChordQuality[ChordQuality["Augmented"] = 2] = "Augmented";
    ChordQuality[ChordQuality["Diminished"] = 3] = "Diminished";
    ChordQuality[ChordQuality["Other"] = 4] = "Other";
})(ChordQuality = exports.ChordQuality || (exports.ChordQuality = {}));
var ChordSymbolException = (function (_super) {
    __extends(ChordSymbolException, _super);
    function ChordSymbolException(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return ChordSymbolException;
}(Error));
exports.ChordSymbolException = ChordSymbolException;
var ChordEncodingException = (function (_super) {
    __extends(ChordEncodingException, _super);
    function ChordEncodingException(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return ChordEncodingException;
}(Error));
exports.ChordEncodingException = ChordEncodingException;
var ChordSymbols = (function () {
    function ChordSymbols() {
    }
    ChordSymbols.pitches = function (chord) {
        var root = tonal_1.Chord.tokenize(chord)[0];
        if (!root || !tonal_1.Chord.exists(chord)) {
            throw new ChordSymbolException("Unrecognized chord symbol: " + chord);
        }
        var notes = tonal_1.Chord.notes(chord);
        return notes.map(tonal_1.Note.chroma);
    };
    ChordSymbols.root = function (chord) {
        var root = tonal_1.Chord.tokenize(chord)[0];
        if (!root) {
            throw new ChordSymbolException("Chord symbol has unknown root: " + chord);
        }
        return tonal_1.Note.chroma(root);
    };
    ChordSymbols.quality = function (chord) {
        if (!tonal_1.Chord.exists(chord)) {
            throw new ChordSymbolException("Unrecognized chord symbol: " + chord);
        }
        var intervals = tonal_1.Chord.intervals(chord);
        var qualities = CHORD_QUALITY_INTERVALS.map(function (cqis) { return cqis.every(function (cqi) { return intervals.includes(cqi); }); });
        var i = qualities.indexOf(true);
        var j = qualities.lastIndexOf(true);
        if (i >= 0 && i === j) {
            return i;
        }
        else {
            return ChordQuality.Other;
        }
    };
    return ChordSymbols;
}());
exports.ChordSymbols = ChordSymbols;
var ChordEncoder = (function () {
    function ChordEncoder() {
    }
    ChordEncoder.prototype.encodeProgression = function (chords, numSteps) {
        var _this = this;
        var encodedChords = chords.map(function (chord) { return _this.encode(chord); });
        var indices = Array.from(Array(numSteps).keys())
            .map(function (step) { return Math.floor(step * encodedChords.length / numSteps); });
        return tf.stack(indices.map(function (i) { return encodedChords[i]; }));
    };
    return ChordEncoder;
}());
exports.ChordEncoder = ChordEncoder;
function chordEncoderFromType(type) {
    switch (type) {
        case 'MajorMinorChordEncoder':
            return new MajorMinorChordEncoder();
        case 'TriadChordEncoder':
            return new TriadChordEncoder();
        case 'PitchChordEncoder':
            return new PitchChordEncoder();
        default:
            throw new Error("Unknown chord encoder type: " + type);
    }
}
exports.chordEncoderFromType = chordEncoderFromType;
var MajorMinorChordEncoder = (function (_super) {
    __extends(MajorMinorChordEncoder, _super);
    function MajorMinorChordEncoder() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.depth = 1 + 2 * constants.NUM_PITCH_CLASSES;
        return _this;
    }
    MajorMinorChordEncoder.prototype.index = function (chord) {
        if (chord === constants.NO_CHORD) {
            return 0;
        }
        var root = ChordSymbols.root(chord);
        var quality = ChordSymbols.quality(chord);
        var index = 1 + quality * constants.NUM_PITCH_CLASSES + root;
        if (index >= this.depth) {
            throw new ChordEncodingException("Chord is neither major nor minor: " + chord);
        }
        return index;
    };
    MajorMinorChordEncoder.prototype.encode = function (chord) {
        var _this = this;
        return tf.tidy(function () { return tf.oneHot(tf.tensor1d([_this.index(chord)], 'int32'), _this.depth)
            .as1D(); });
    };
    return MajorMinorChordEncoder;
}(ChordEncoder));
exports.MajorMinorChordEncoder = MajorMinorChordEncoder;
var TriadChordEncoder = (function (_super) {
    __extends(TriadChordEncoder, _super);
    function TriadChordEncoder() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.depth = 1 + 4 * constants.NUM_PITCH_CLASSES;
        return _this;
    }
    TriadChordEncoder.prototype.index = function (chord) {
        if (chord === constants.NO_CHORD) {
            return 0;
        }
        var root = ChordSymbols.root(chord);
        var quality = ChordSymbols.quality(chord);
        var index = 1 + quality * constants.NUM_PITCH_CLASSES + root;
        if (index >= this.depth) {
            throw new ChordEncodingException("Chord is not a standard triad: " + chord);
        }
        return index;
    };
    TriadChordEncoder.prototype.encode = function (chord) {
        var _this = this;
        return tf.tidy(function () { return tf.oneHot(tf.tensor1d([_this.index(chord)], 'int32'), _this.depth)
            .as1D(); });
    };
    return TriadChordEncoder;
}(ChordEncoder));
exports.TriadChordEncoder = TriadChordEncoder;
var PitchChordEncoder = (function (_super) {
    __extends(PitchChordEncoder, _super);
    function PitchChordEncoder() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.depth = 1 + 3 * constants.NUM_PITCH_CLASSES;
        return _this;
    }
    PitchChordEncoder.prototype.encode = function (chord) {
        var _this = this;
        return tf.tidy(function () {
            if (chord === constants.NO_CHORD) {
                return tf.oneHot(tf.tensor1d([0], 'int32'), _this.depth).as1D();
            }
            var root = ChordSymbols.root(chord);
            var rootEncoding = tf.oneHot(tf.tensor1d([root], 'int32'), constants.NUM_PITCH_CLASSES)
                .as1D();
            var pitchBuffer = tf.buffer([constants.NUM_PITCH_CLASSES]);
            ChordSymbols.pitches(chord).forEach(function (pitch) { return pitchBuffer.set(1.0, pitch); });
            var pitchEncoding = pitchBuffer.toTensor().as1D();
            var bassEncoding = rootEncoding;
            return tf.concat1d([tf.tensor1d([0.0]), rootEncoding, pitchEncoding, bassEncoding]);
        });
    };
    return PitchChordEncoder;
}(ChordEncoder));
exports.PitchChordEncoder = PitchChordEncoder;
//# sourceMappingURL=chords.js.map