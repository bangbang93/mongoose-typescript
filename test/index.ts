import {get} from 'lodash'
import mongoose from 'mongoose'
import should from 'should'
import {
  array, DocumentType, getModel, getModelName, getSchema, hidden, id, index, indexed, methods, middleware, model,
  ObjectId, plugin, prop, Ref, ref, refArray, required, RichModelType, statics, subModel, unique,
} from '../src'

mongoose.connect('mongodb://localhost/test')

function testPlugin(schema: mongoose.Schema, options: any) {
  schema.statics.testPluginFunc = () => options
}

@subModel()
class Address {
  @prop({maxlength: 10}) @required() public country!: string
  @prop() @required() public province!: string
  @prop() @required() public city!: string
  @prop() @required() public address!: string
}

enum AccountRole {
  user = 'USER',
  admin = 'ADMIN',
}
@subModel()
class Account {
  @prop() @required() public name!: string
  @prop() public role!: AccountRole
}

let hookRun = 0

@model('some-string-id-model')
class SomeStringIdModel {
  @id()
  public readonly _id!: string
}
getModelName(SomeStringIdModel).should.eql('some-string-id-model')

@model('user')
@middleware<User>('findOne', 'pre', function findOneHook() {hookRun++})
@plugin(testPlugin, {testPlugin: true})
class User {
  @id() public readonly _id!: mongoose.Types.ObjectId

  @prop() @unique() @required() public username!: string
  @prop() @hidden() public password!: string
  @prop() @indexed() public loginCount!: number
  @array(Address) public addresses!: Address[]
  @prop() public account!: Account
  @ref(() => SomeStringIdModel, String) public someStringIdModel!: Ref<SomeStringIdModel>

  @statics()
  public static async findByName(this: RichModelType<typeof User>, name: string): Promise<User | null> {
    return this.findOne({username: name})
  }

  @methods()
  public addAddress(address: Address): this {
    this.addresses.push(address)
    return this
  }
}
getModelName(User).should.eql('user')

@model('organization')
@index({user: 1, name: 1}, {unique: true})
class Organization {
  @id() public readonly _id!: mongoose.Types.ObjectId

  @ref(() => User, ObjectId) @required() public user!: Ref<User>
  @prop() @unique() @required() public name!: string
  @refArray(() => User, ObjectId) public members!: Array<Ref<User>>

  @statics()
  public static async listByUser(this: RichModelType<typeof Organization>,
    userId: string): Promise<DocumentType<Organization>[]> {
    return this.find({
      members: userId,
    })
  }

  @methods()
  public async addMember(this: DocumentType<Organization>,
    userId: mongoose.Types.ObjectId): Promise<DocumentType<Organization>> {
    this.members.push(userId)
    return this.save()
  }
}
getModelName(Organization).should.eql('organization')

describe('User', () => {
  let UserModel: RichModelType<typeof User>
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

    await UserModel.findByIdAndUpdate(new ObjectId(), {
      $set: {
        password: 'bar',
      },
    })

    user.addresses[0].country.should.eql('china')
    should(get(user.addresses, 'pull')).not.undefined()
    should(get(user.addresses[0], 'toObject')).not.undefined()

    await user.save().should
      .rejectedWith('user validation failed: addresses.0.province: Path `province` is required.')
  })

  it('hook', () => {
    hookRun.should.greaterThan(0)
  })

  it('plugin', () => {
    (UserModel as any).testPluginFunc().testPlugin.should.eql(true)
  })
})

describe('organization', () => {
  let OrganizationModel: RichModelType<typeof Organization>
  it('getModel', () => {
    const OrganizationSchema = getSchema(Organization)
    OrganizationModel = getModel(Organization)
    should(OrganizationModel.listByUser).not.undefined()
    should(get(OrganizationSchema, 'paths.user.instance')).eql('ObjectID')
  })
})

after(async () => {
  await mongoose.disconnect()
})
