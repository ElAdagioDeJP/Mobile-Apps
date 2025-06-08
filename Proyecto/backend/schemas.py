from marshmallow import Schema, fields

class UserSchema(Schema):
    id       = fields.Int(dump_only=True)
    email    = fields.Email(required=True)

class SectionSchema(Schema):
    id        = fields.Int(dump_only=True)
    category  = fields.Str(required=True)
    date      = fields.DateTime()
    finished  = fields.Bool()
    codeA     = fields.Str()
    codeB     = fields.Str()
    scoreA    = fields.Int()
    scoreB    = fields.Int()
    gender    = fields.Str()
    positions = fields.List(fields.Str())
