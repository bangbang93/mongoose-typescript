import {Aggregate, Document, Model, Query} from 'mongoose'
import {DocumentType} from './index'
import {Fn, getMongooseMeta} from './meta'

export type HookType = 'pre' | 'post'
type DocumentMiddlewareType = 'validate' | 'save' | 'remove' | 'init'
type QueryMiddlewareType = 'count' | 'find' | 'findOne' | 'findOneAndRemove' | 'findOneAndUpdate' | 'update'
| 'updateOne' | 'updateMany'
type AggregateMiddlewareType = 'aggregate'
type ModelMiddlewareType = 'insertMany'

export type ActionType = DocumentMiddlewareType | QueryMiddlewareType | AggregateMiddlewareType
| ModelMiddlewareType


type R<T> = T | Promise<T>
type DocumentHookFunction<T> = (this: DocumentType<T>, error?: Error, doc?: DocumentType<T>, next?: Fn) => R<unknown>
type QueryHookFunction<T, Doc = DocumentType<T>> =
  (this: Query<Doc, T>, error?: Error, doc?: Query<Doc, T>, next?: Fn) => R<unknown>
type AggregateHookFunction<T> = (this: Aggregate<T>, error?: Error, doc?: Aggregate<T>, next?: Fn) => R<unknown>
type ModelHookFunction<T extends Document> = (this: Model<T>, error?: Error, doc?: Model<T>, next?: Fn) => R<unknown>
type HookFunction<T> = T extends Document ? ModelHookFunction<T> | QueryHookFunction<T>
  : DocumentHookFunction<T> | AggregateHookFunction<T>


export function middleware<T>(actionType: DocumentMiddlewareType, hookType: HookType,
  hookFunction: DocumentHookFunction<T>): ClassDecorator
export function middleware<T>(actionType: QueryMiddlewareType, hookType: HookType,
  hookFunction: QueryHookFunction<T>): ClassDecorator
export function middleware<T>(actionType: AggregateMiddlewareType, hookType: HookType,
  hookFunction: AggregateHookFunction<T>): ClassDecorator
export function middleware<T extends Document>(actionType: ModelMiddlewareType, hookType: HookType,
  hookFunction: ModelHookFunction<T>): ClassDecorator
export function middleware<T>(actionType: ActionType, hookType: HookType,
  hookFunction: HookFunction<T>): ClassDecorator {
  return (target): void => {
    getMongooseMeta(target.prototype).middleware
      .push([actionType, hookType, hookFunction])
  }
}
