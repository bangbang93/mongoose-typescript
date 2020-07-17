// tslint:disable:no-console
import * as mongoose from 'mongoose'
import 'should'
import {
  array, DocumentType, getModel, getSchema, hidden, id, index, indexed, methods, middleware, Model, model, ModelType,
  ObjectId,
  plugin, prop, Ref, ref, refArray, required, statics, subModel, unique,
} from '../src'

mongoose.connect('mongodb://localhost/test')

function testPlugin(schema: mongoose.Schema, options: any) {
  schema.statics.testPluginFunc = () => options
}

@subModel()
class Address {
  @prop() @required() public country: string
  @prop() @required() public province: string
  @prop() @required() public city: string
  @prop() @required() public address: string
}

enum AccountRole {
  user = 'USER',
  admin = 'ADMIN',
}
@subModel()
class Account {
  @prop() @required() public name: string
  @prop() public role: AccountRole
}

let hookRun = 0

@model('some-string-id-model')
class SomeStringIdModel {
  @id()
  public readonly _id: string
}

@model('user')
@middleware<User>('findOne', 'pre', () => hookRun++)
@plugin(testPlugin, {testPlugin: true})
class User extends Model<User> {
  @id() public readonly _id: mongoose.Types.ObjectId

  @prop() @unique() @required() public username: string
  @prop() @hidden() public password: string
  @prop() @indexed() public loginCount: number
  @array(Address) public addresses: Address[]
  @prop() public account: Account
  @ref(() => SomeStringIdModel, String) public someStringIdModel: Ref<SomeStringIdModel>

  @statics()
  public static async findByName(name: string): Promise<User> {
    return this.findOne({username: name})
  }

  @methods()
  public addAddress(address: Address): this {
    this.addresses.push(address)
    return this
  }
}

@model('organization')
@index({user: 1, name: 1}, {unique: true})
class Organization extends Model<Organization> {
  @id() public readonly _id: mongoose.Types.ObjectId

  @ref(() => User, ObjectId) @required() public user: Ref<User>
  @prop() @unique() @required() public name: string
  @refArray(() => User, ObjectId) public members: Array<Ref<User>>

  @statics()
  public static async listByUser(userId: string): Promise<DocumentType<Organization>[]> {
    return this.find({
      members: userId,
    })
  }

  @methods()
  public async addMember(userId: mongoose.Types.ObjectId): Promise<this> {
    this.members.push(userId)
    return this.save()
  }
}

describe('User', () => {
  let UserModel: ModelType<User> & typeof User
  it('getModel', () => {
    UserModel = getModel(User)
    UserModel.should.ownProperty('findByName')
  })

  it('find', async () => {
    return UserModel.findByName('aaa')
  })

  it('document', async () => {
    const user = new UserModel({
      username: 'abc',
      password: 'wow',
      addresses: [{
        country: 'china',
        city: 'hangzhou',
        address: 'xihu',
      }],
      account: {
        name: 'aaa',
      },
    })

    user.someStringIdModel = 'a'

    user.addAddress({
      country: 'china',
      province: 'zhejiang',
      city: 'hangzhou',
      address: 'cuiyuan',
    })

    user.addresses[0].country.should.eql('china')

    await user.save().should
      .rejectedWith('user validation failed: addresses.0.province: Path `province` is required().')
  })

  it('hook', () => {
    hookRun.should.greaterThan(0)
  })

  it('plugin', () => {
    (UserModel as any).testPluginFunc().testPlugin.should.eql(true)
  })
})

describe('organization', () => {
  let OrganizationModel: typeof Organization
  it('getModel', () => {
    const OrganizationSchema = getSchema(Organization)
    OrganizationModel = getModel(Organization)
    OrganizationModel.should.ownProperty('listByUser')
    OrganizationSchema['paths'].members['casterConstructor'].name.should.eql('ObjectId')
  })
})

after(async () => {
  await mongoose.disconnect()
})
