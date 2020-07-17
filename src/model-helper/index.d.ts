import {Document, Model as mongooseModel} from 'mongoose'

export declare class Model<T> extends mongooseModel {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Model<T> extends Document {}
