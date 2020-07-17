import {Document, model, Model, Schema, Types} from 'mongoose'
import 'reflect-metadata'

import {Fn, getMongooseMeta, IMongooseClass, MongooseMeta} from './meta'
import {ActionType, HookType} from './middleware'

export * from './model'
export * from './schema'
export * from './model-helper'
export * from './middleware'
export {default as validators} from './validator'
// mongoose shortcut
export const ObjectId = Types.ObjectId
export type ObjectId = Types.ObjectId

export type DocumentType<T> = T & Document
export type ModelType<T> = Model<DocumentType<T>>
export type Ref<T extends {_id: unknown}> = T['_id'] | DocumentType<T>

const modelCache = new WeakMap<IMongooseClass, ModelType<IMongooseClass>>()
const schemaCache = new WeakMap<MongooseMeta, Schema>()

export function getSchema<T extends IMongooseClass>(modelClass: T): Schema {
  const meta = getMongooseMeta(modelClass.prototype)
  if (schemaCache.has(meta)) {
    return schemaCache.get(meta)
  }

  const schema = buildSchema(meta)
  schemaCache.set(meta, schema)
  return schema
}

export function getModel<T extends IMongooseClass>(modelClass: T): ModelType<T> {
  if (modelCache.has(modelClass)) {
    return modelCache.get(modelClass) as ModelType<T>
  }
  const meta = getMongooseMeta(modelClass.prototype)
  if (!meta.name) throw new Error(`name not set for model ${modelClass.constructor.name}`)
  const newModel: ModelType<T> = model(meta.name, getSchema(modelClass))
  modelCache.set(modelClass, newModel)
  return newModel
}

export function getModelName<T extends IMongooseClass>(modelClass: T): string {
  const meta = getMongooseMeta(modelClass.prototype)
  return meta.name
}

function buildSchema(meta: MongooseMeta): Schema {
  const schema = new Schema(meta.schema, meta.options)

  Object.keys(meta.statics)
    .forEach((name) => {
      schema.statics[name] = meta.statics[name]
    })

  Object.keys(meta.methods)
    .forEach((name) => {
      schema.methods[name] = meta.methods[name]
    })

  Object.keys(meta.queries)
    .forEach((name) => {
      schema.query[name] = meta.queries[name]
    })

  Object.keys(meta.virtuals)
    .forEach((name) => {
      const virtual = schema.virtual(name)
      const descriptor = meta.virtuals[name]

      if (descriptor.get) virtual.get(descriptor.get)

      if (descriptor.set) virtual.set(descriptor.set)
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
