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
var midiconvert = require("midiconvert");
var protobuf_1 = require("../protobuf");
var constants = require("./constants");
var sequences = require("./sequences");
var MidiConversionError = (function (_super) {
    __extends(MidiConversionError, _super);
    function MidiConversionError(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return MidiConversionError;
}(Error));
exports.MidiConversionError = MidiConversionError;
function midiToSequenceProto(midi) {
    var parsedMidi = midiconvert.parse(midi);
    var ns = protobuf_1.NoteSequence.create();
    ns.ticksPerQuarter = parsedMidi.header.PPQ;
    ns.sourceInfo = protobuf_1.NoteSequence.SourceInfo.create({
        parser: protobuf_1.NoteSequence.SourceInfo.Parser.TONEJS_MIDI_CONVERT,
        encodingType: protobuf_1.NoteSequence.SourceInfo.EncodingType.MIDI
    });
    if (parsedMidi.header.timeSignature) {
        ns.timeSignatures.push(protobuf_1.NoteSequence.TimeSignature.create({
            time: 0,
            numerator: parsedMidi.header.timeSignature[0],
            denominator: parsedMidi.header.timeSignature[1],
        }));
    }
    else {
        ns.timeSignatures.push(protobuf_1.NoteSequence.TimeSignature.create({
            time: 0,
            numerator: 4,
            denominator: 4,
        }));
    }
    ns.tempos.push(protobuf_1.NoteSequence.Tempo.create({ time: 0, qpm: parsedMidi.header.bpm }));
    var instrumentNumber = -1;
    for (var _i = 0, _a = parsedMidi.tracks; _i < _a.length; _i++) {
        var track = _a[_i];
        if (track.notes.length > 0) {
            instrumentNumber += 1;
        }
        for (var _b = 0, _c = track.notes; _b < _c.length; _b++) {
            var note = _c[_b];
            var startTime = note.time;
            var duration = note.duration;
            var endTime = startTime + duration;
            ns.notes.push(protobuf_1.NoteSequence.Note.create({
                instrument: instrumentNumber,
                program: track.instrumentNumber,
                startTime: startTime,
                endTime: endTime,
                pitch: note.midi,
                velocity: Math.floor(note.velocity * constants.MIDI_VELOCITIES),
                isDrum: track.isPercussion
            }));
            if (endTime > ns.totalTime) {
                ns.totalTime = endTime;
            }
        }
    }
    return ns;
}
exports.midiToSequenceProto = midiToSequenceProto;
function sequenceProtoToMidi(ns) {
    if (sequences.isQuantizedSequence(ns)) {
        ns = sequences.unquantizeSequence(ns);
    }
    if (!ns.tempos || ns.tempos.length === 0) {
        ns.tempos = [{ time: 0, qpm: constants.DEFAULT_QUARTERS_PER_MINUTE }];
    }
    if (!ns.timeSignatures || ns.timeSignatures.length === 0) {
        ns.timeSignatures = [{ time: 0, numerator: 4, denominator: 4 }];
    }
    if (ns.tempos.length !== 1 || ns.tempos[0].time !== 0) {
        throw new MidiConversionError('NoteSequence must have exactly 1 tempo at time 0');
    }
    if (ns.timeSignatures.length !== 1 || ns.timeSignatures[0].time !== 0) {
        throw new MidiConversionError('NoteSequence must have exactly 1 time signature at time 0');
    }
    var json = {
        header: {
            bpm: ns.tempos[0].qpm,
            PPQ: ns.ticksPerQuarter ? ns.ticksPerQuarter :
                constants.DEFAULT_TICKS_PER_QUARTER,
            timeSignature: [ns.timeSignatures[0].numerator, ns.timeSignatures[0].denominator]
        },
        tracks: []
    };
    var tracks = new Map();
    for (var _i = 0, _a = ns.notes; _i < _a.length; _i++) {
        var note = _a[_i];
        var instrument = note.instrument ? note.instrument : 0;
        if (!tracks.has(instrument)) {
            tracks.set(instrument, []);
        }
        tracks.get(instrument).push(note);
    }
    var instruments = Array.from(tracks.keys()).sort(function (a, b) { return a - b; });
    for (var i = 0; i < instruments.length; i++) {
        if (i !== instruments[i]) {
            throw new MidiConversionError('Instrument list must be continuous and start at 0');
        }
        var notes = tracks.get(i);
        var track = {
            id: i,
            notes: [],
            isPercussion: (notes[0].isDrum === undefined) ? false : notes[0].isDrum,
            channelNumber: notes[0].isDrum ? constants.DRUM_CHANNEL :
                constants.DEFAULT_CHANNEL,
            instrumentNumber: (notes[0].program === undefined) ?
                constants.DEFAULT_PROGRAM :
                notes[0].program
        };
        track.notes = notes.map(function (note) {
            var velocity = (note.velocity === undefined) ?
                constants.DEFAULT_VELOCITY :
                note.velocity;
            return {
                midi: note.pitch,
                time: note.startTime,
                duration: note.endTime - note.startTime,
                velocity: (velocity + 1) / constants.MIDI_VELOCITIES
            };
        });
        json['tracks'].push(track);
    }
    return new Uint8Array(midiconvert.fromJSON(json).toArray());
}
exports.sequenceProtoToMidi = sequenceProtoToMidi;
function urlToBlob(url) {
    return new Promise(function (resolve, reject) {
        fetch(url)
            .then(function (response) {
            return response.blob();
        })
            .then(function (blob) {
            resolve(blob);
        })
            .catch(function (error) { return reject(error); });
    });
}
exports.urlToBlob = urlToBlob;
function blobToNoteSequence(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
            resolve(midiToSequenceProto(e.target.result));
        };
        reader.onerror = function (e) { return reject(e); };
        reader.readAsBinaryString(blob);
    });
}
exports.blobToNoteSequence = blobToNoteSequence;
function urlToNoteSequence(url) {
    return urlToBlob(url).then(blobToNoteSequence);
}
exports.urlToNoteSequence = urlToNoteSequence;
//# sourceMappingURL=midi_io.js.map