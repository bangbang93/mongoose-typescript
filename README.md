# mongoose-typescript
Build mongoose schema with typescript and decorator

## Before Usage
make sure that both `experimentalDecorators` and `emitDecoratorMetadata` are set to true in tsconfig

## Example

```typescript
@subModel()
class Address {
  @prop() @required public country: string
  @prop() @required public province: string
  @prop() @required public city: string
  @prop() @required public address: string
}

@model('user')
class User extends Model<User> {
  @statics
  public static async findByName(name: string): Promise<User> {
    return this.findOne({username: name})
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @prop() @unique @required public username: string
  @prop() @hidden public password: string
  @prop() @indexed public loginCount: number
  @array(Address) public addresses: Address[]

  @methods
  public addAddress(address: Address) {
    this.addresses.push(address)
    return this
  }
}

@model('organization')
@index({user: 1, name: 1}, {unique: true})
class Organization extends Model<Organization> {
  @statics
  public static async listByUser(userId: string) {
    return this.find({
      members: userId,
    })
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @ref(User) @required public user: Ref<User>
  @prop() @unique @required public name: string
  @array() @ref(User) public members: Array<Ref<User>>

  @methods
  public async addMember(userId: mongoose.Types.ObjectId) {
    this.members.push(userId)
    return this.save()
  }
}

const UserModel: typeof User = getModel(User)

const user = new UserModel({
  username: 'abc',
  password: 'wow',
  addresses: [{
    country: 'china',
    provicne: 'zhejiang',
    city: 'hangzhou',
    address: 'xihu',
  }],
})

user.save()
```

## Function
`getSchema(model): Schema` get Schema for custom config

`getModel(model): Model` get Model

## Model level Decorators

`@model(name: string, options?: SchemaOptions)`

`@index(fields: IIndexArgs['fields'], options?: IIndexArgs['options']`

`@subModel(options: SchemaOptions & {name?: string} = {})`

## Schema level Decorators

`@prop(options: SchemaTypeOpts<T> = {}, type?: T)` type is optional, mongoose-typescript will try to determined the type automatically

`@array(type?: T, options?: SchemaTypeOpts<T>)` because of typescript only mark the type as Array, so array field need set type manually, or using mixed

`@id` empty decorator, just for emit Reflect metadata for `_id`

`@required` set schema `{required: true}`

`@indexed` set schema `{index: true}`

`@hidden` set schema `{select: false}`

`@unique` set schema `{unique: false}`

`@type(type)` set schema `{type: type}`

`@defaults(value)` set schema `{default: value}`

`@ref(nameOrClass: string | IMongooseClass)` set schema `{ref: nameOrClass}`
if type isn't set, and the argument is class, `mongoose-typescript` will try to using the typeof `class._id`

`@statics` register statics method

`@methods` register instance method

`@query` register query helper

`@virtual` register virtual field

## APIDOC
<https://bangbang93.github.io/mongoose-typescript>
