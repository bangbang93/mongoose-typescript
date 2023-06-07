import {Primitive} from '@sindresorhus/is'
import {Document, HydratedDocument, model, Model, Schema, Types} from 'mongoose'
import 'reflect-metadata'
import {Class, Constructor} from 'type-fest'

import {Fn, getMongooseMeta, MongooseMeta} from './meta'
import {ActionType, HookType} from './middleware'

export * from './model'
export * from './schema'
export * from './model-helper'
export * from './middleware'
export {default as validators} from './validator'
// mongoose shortcut
export const ObjectId = Types.ObjectId
export type ObjectId = Types.ObjectId

type ArrayType<T> = T extends Primitive ? Types.Array<T> : Types.Array<Types.Subdocument & T>
// export type DocumentType<T extends {_id?: TId}, TId = unknown> = T & Document<T['_id'], any, T>
export type DocumentType<T> = HydratedDocument<T>
export type RichDocumentType<T extends {_id?: unknown}> = {
  [TKey in keyof T]:
  T[TKey] extends Array<infer TValue> ? ArrayType<TValue> :
    T[TKey] extends Buffer ? Types.Buffer :
      T[TKey] extends Date ? Date :
        T[TKey] extends Record<string, unknown> ? Types.Subdocument & T[TKey] :
          T[TKey]
} & Document<T['_id']>
/** @deprecated use RichModelType<typeof ModelClass> */
export type ModelType<T, THelper = object> = Model<DocumentType<T>, THelper>
export type RichModelType<T extends Constructor<object>, THelper = object> = Model<InstanceType<T>, THelper> & T
export type Ref<T extends {_id?: unknown}> = T['_id'] | T
export type RefDocument<T extends {_id?: unknown}> = T['_id'] | DocumentType<T>

const modelCache = new WeakMap<Class<object>, Model<object>>()
const schemaCache = new WeakMap<MongooseMeta, Schema>()

export function getSchema<T>(modelClass: Class<T>): Schema {
  const meta = getMongooseMeta(modelClass.prototype)
  let schema = schemaCache.get(meta)
  if (schema) return schema

  schema = buildSchema(meta)
  schemaCache.set(meta, schema)
  return schema
}

export function getModel<T extends Constructor<object>>(modelClass: T): RichModelType<T> {
  if (modelCache.has(modelClass)) {
    return modelCache.get(modelClass) as unknown as RichModelType<T>
  }
  const meta = getMongooseMeta(modelClass.prototype)
  if (!meta.name) throw new Error(`name not set for model ${modelClass.constructor.name}`)
  const newModel = model(meta.name, getSchema(modelClass))
  modelCache.set(modelClass, newModel)
  return newModel as unknown as RichModelType<T>
}

export function getModelName<T extends Constructor<object>>(modelClass: T): string {
  const meta = getMongooseMeta(modelClass.prototype)
  return meta.name
}

export function forNestModule<T extends Constructor<object>>(modelClass: T): {name: string; schema: Schema} {
  return {
    name: getModelName(modelClass), schema: getSchema(modelClass),
  }
}

function buildSchema<T>(meta: MongooseMeta): Schema<T> {
  const schema = new Schema(meta.schema, meta.options)

  Object.assign(schema.statics, meta.statics)
  Object.assign(schema.methods, meta.methods)
  Object.assign(schema.query, meta.queries)


  Object.keys(meta.virtuals)
    .forEach((name) => {
      const virtual = schema.virtual(name)
      const descriptor = meta.virtuals[name]

      if (descriptor.value) {
        virtual.get(descriptor.value)
      } else {
        if (descriptor.get) virtual.get(descriptor.get)

        if (descriptor.set) virtual.set(descriptor.set)
      }
    })

  meta.indexes.forEach(({fields, options}) => {
    schema.index(fields, options)
  })

  meta.middleware.forEach(([actionType, hookType, fn]: [ActionType, HookType, Fn]) => {
    (schema[hookType] as any)(actionType, fn)
  })

  meta.plugins.forEach(({plugin, options}) => {
    schema.plugin(plugin, options)
  })

  return schema
}
