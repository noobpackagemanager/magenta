import * as tf from '@tensorflow/tfjs-core';
declare class PianoGenie {
    private checkpointURL;
    private initialized;
    private modelVars;
    private decLSTMCells;
    private decForgetBias;
    private lastState;
    private lastOutput;
    private lastTime;
    private deltaTimeOverride;
    constructor(checkpointURL: string);
    isInitialized(): boolean;
    initialize(staticVars?: tf.NamedTensorMap): Promise<void>;
    next(button: number, temperature?: number, seed?: number): number;
    nextFromKeyWhitelist(button: number, keyWhitelist: number[], temperature?: number, seed?: number): number;
    nextWithCustomSamplingFunction(button: number, sampleFunc: (logits: tf.Tensor1D) => tf.Scalar): number;
    resetState(): void;
    dispose(): void;
    overrideLastOutput(lastOutput: number): void;
    overrideDeltaTime(deltaTime: number): void;
    private evaluateModelAndSample;
}
export { PianoGenie };
