import {Document, model, Model, Schema, Types} from 'mongoose'
import 'reflect-metadata'

import {ActionType, Fn, getMongooseMeta, HookType, IMongooseClass, MongooseMeta} from './meta'

export * from './model'
export * from './schema'
export * from './model-helper'

type DocumentType<T> = T & Document
type ModelType<T> = Model<DocumentType<T>>
export type Ref<T> = Types.ObjectId | DocumentType<T>

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

export function getModel<T extends IMongooseClass>(modelClass: T): T {

  if (modelCache.has(modelClass)) {
    return modelCache.get(modelClass) as any
  }
  const meta = getMongooseMeta(modelClass.prototype)
  if (!meta.name) throw new Error(`name not set for model ${modelClass.constructor.name}`)
  const newModel = model(meta.name, getSchema(modelClass))
  modelCache.set(modelClass, newModel as any)
  return newModel as any
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

  meta.hooks.forEach(([hookType, actionType, fn]: [HookType, ActionType, Fn]) => {
    schema[hookType](actionType, fn)
  })

  return schema
}
