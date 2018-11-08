import {Document, Model as mongooseModel} from 'mongoose'

export declare class Model<T> extends mongooseModel {}
// tslint:disable-next-line:interface-name no-empty-interface
export interface Model<T> extends Document {}
